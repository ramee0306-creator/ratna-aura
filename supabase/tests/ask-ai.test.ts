import type { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';

import { asUser, createUser, freshDatabase } from './supabase-stub';

/** Run as the server (service role), like the edge functions do. */
async function asServer<T>(db: PGlite, fn: () => Promise<T>): Promise<T> {
  await db.exec('set role service_role');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}

const spend = async (db: PGlite, user: string) =>
  (await asServer(db, () => db.query<{ r: string }>(`select public.spend_question($1, 3) as r`, [user]))).rows[0].r;

const wallet = async (db: PGlite, user: string) =>
  (await db.query<{ credits: number; free_questions_used: number }>(`select credits, free_questions_used from public.wallets where user_id = $1`, [user]))
    .rows[0];

describe('Ask AI credits and chats', () => {
  let db: PGlite;
  let alice: string;
  let bob: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
    bob = await createUser(db);
  });

  it('3 free questions, then credits, then nothing', async () => {
    expect([await spend(db, alice), await spend(db, alice), await spend(db, alice)]).toEqual(['free', 'free', 'free']);
    expect(await spend(db, alice)).toBe('none');
    await asServer(db, () => db.query(`select public.add_credits($1, 2, 'test_purchase')`, [alice]));
    expect([await spend(db, alice), await spend(db, alice), await spend(db, alice)]).toEqual(['credit', 'credit', 'none']);
    expect(await wallet(db, alice)).toEqual({ credits: 0, free_questions_used: 3 });
    const { rows } = await db.query<{ change: number; reason: string }>(`select change, reason from public.credit_ledger where user_id = $1 order by id`, [alice]);
    expect(rows).toEqual([
      { change: 2, reason: 'test_purchase' },
      { change: -1, reason: 'question' },
      { change: -1, reason: 'question' },
    ]);
    expect(await spend(db, bob)).toBe('free'); // each user has their own
  });

  it('refunds a question that could not be answered', async () => {
    await spend(db, alice);
    await asServer(db, () => db.query(`select public.refund_question($1, 'free')`, [alice]));
    expect(await wallet(db, alice)).toEqual({ credits: 0, free_questions_used: 0 });
    await asServer(db, () => db.query(`select public.add_credits($1, 1, 'gift')`, [alice]));
    for (let i = 0; i < 3; i++) await spend(db, alice);
    expect(await spend(db, alice)).toBe('credit');
    await asServer(db, () => db.query(`select public.refund_question($1, 'credit')`, [alice]));
    expect(await wallet(db, alice)).toEqual({ credits: 1, free_questions_used: 3 });
  });

  it('a store purchase is credited only once', async () => {
    await asServer(db, () => db.query(`select public.add_credits($1, 10, 'purchase', 'GPA.1234')`, [alice]));
    await expect(asServer(db, () => db.query(`select public.add_credits($1, 10, 'purchase', 'GPA.1234')`, [alice]))).rejects.toThrow(/duplicate key/);
    expect((await wallet(db, alice)).credits).toBe(10);
  });

  it('rejects invalid credit changes', async () => {
    await expect(asServer(db, () => db.query(`select public.add_credits($1, -5, 'gift')`, [alice]))).rejects.toThrow(/invalid credit change/);
    await expect(asServer(db, () => db.query(`select public.add_credits($1, 5, 'question')`, [alice]))).rejects.toThrow(/invalid credit change/);
  });

  it('users can read only their own wallet and ledger, and cannot give themselves credits', async () => {
    await asServer(db, () => db.query(`select public.add_credits($1, 5, 'gift')`, [alice]));
    await asServer(db, () => db.query(`select public.add_credits($1, 7, 'gift')`, [bob]));
    const mine = await asUser(db, alice, async () => (await db.query(`select credits from public.wallets`)).rows);
    expect(mine).toEqual([{ credits: 5 }]);
    const ledger = await asUser(db, alice, async () => (await db.query(`select change from public.credit_ledger`)).rows);
    expect(ledger).toEqual([{ change: 5 }]);
    await expect(asUser(db, alice, () => db.query(`update public.wallets set credits = 999 where user_id = $1`, [alice]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, alice, () => db.query(`select public.add_credits($1, 100, 'gift')`, [alice]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, alice, () => db.query(`select public.spend_question($1, 1000)`, [alice]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, alice, () => db.query(`select public.refund_question($1, 'credit')`, [alice]))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, null, () => db.query(`select * from public.wallets`))).rejects.toThrow(/permission denied/);
  });

  it('chat tables are hidden from the app', async () => {
    const { rows } = await db.query<{ id: string }>(`insert into public.chat_threads (owner_id) values ($1) returning id`, [alice]);
    await db.query(`insert into public.chat_messages (thread_id, owner_id, role, content_enc) values ($1, $2, 'user', 'v1.x.y')`, [rows[0].id, alice]);
    for (const table of ['chat_threads', 'chat_messages']) {
      await expect(asUser(db, alice, () => db.query(`select * from public.${table}`))).rejects.toThrow(/permission denied/);
    }
  });

  it('deleting the account removes wallet, ledger and chats', async () => {
    await asServer(db, () => db.query(`select public.add_credits($1, 5, 'gift')`, [alice]));
    const { rows } = await db.query<{ id: string }>(`insert into public.chat_threads (owner_id) values ($1) returning id`, [alice]);
    await db.query(`insert into public.chat_messages (thread_id, owner_id, role, content_enc) values ($1, $2, 'user', 'v1.x.y')`, [rows[0].id, alice]);
    await db.query(`delete from auth.users where id = $1`, [alice]);
    for (const table of ['wallets', 'credit_ledger', 'chat_threads', 'chat_messages']) {
      expect((await db.query(`select count(*)::int as n from public.${table}`)).rows[0]).toEqual({ n: 0 });
    }
  });

  it('starts with 3 free questions and test payments switched on', async () => {
    const { rows } = await db.query<{ key: string; value: unknown }>(`select key, value from public.app_settings where key in ('free_questions', 'payments_mode') order by key`);
    expect(rows).toEqual([
      { key: 'free_questions', value: 3 },
      { key: 'payments_mode', value: 'test' },
    ]);
  });
});
