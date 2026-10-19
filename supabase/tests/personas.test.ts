import type { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';

import { asUser, createUser, freshDatabase } from './supabase-stub';

async function asServer<T>(db: PGlite, fn: () => Promise<T>): Promise<T> {
  await db.exec('set role service_role');
  try {
    return await fn();
  } finally {
    await db.exec('reset role');
  }
}
const one = async <T>(db: PGlite, sql: string, params: unknown[]) => (await asServer(db, () => db.query<{ r: T }>(sql, params))).rows[0].r;
const credits = async (db: PGlite, user: string) =>
  (await db.query<{ credits: number }>(`select credits from public.wallets where user_id = $1`, [user])).rows[0]?.credits ?? 0;

describe('persona billing', () => {
  let db: PGlite;
  let alice: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
    await asServer(db, () => db.query(`select public.add_credits($1, 10, 'gift')`, [alice]));
  });

  it('per message: takes credits only when the user has enough', async () => {
    expect(await one<boolean>(db, `select public.spend_credits($1, 3, 'persona_message') as r`, [alice])).toBe(true);
    expect(await credits(db, alice)).toBe(7);
    expect(await one<boolean>(db, `select public.spend_credits($1, 8, 'persona_message') as r`, [alice])).toBe(false);
    expect(await credits(db, alice)).toBe(7);
    await asServer(db, () => db.query(`select public.refund_credits($1, 3)`, [alice]));
    expect(await credits(db, alice)).toBe(10);
  });

  it('free questions are not used by personas', async () => {
    await one(db, `select public.spend_credits($1, 1, 'persona_message') as r`, [alice]);
    const { rows } = await db.query(`select free_questions_used from public.wallets where user_id = $1`, [alice]);
    expect(rows[0]).toEqual({ free_questions_used: 0 });
  });

  it('per minute: a paid session allows messages until its cap', async () => {
    const id = await one<string | null>(db, `select public.start_persona_session($1, 'meera', 5, 5) as r`, [alice]);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await credits(db, alice)).toBe(5);
    const use = () => one<boolean>(db, `select public.use_session_message($1, 'meera', 2) as r`, [alice]);
    expect([await use(), await use(), await use()]).toEqual([true, true, false]);
    await asServer(db, () => db.query(`select public.release_session_message($1, 'meera')`, [alice]));
    expect(await use()).toBe(true);
    // a session belongs to one persona only
    expect(await one<boolean>(db, `select public.use_session_message($1, 'tara', 2) as r`, [alice])).toBe(false);
  });

  it('cannot start a session without enough credits, and ended sessions do not count', async () => {
    expect(await one<string | null>(db, `select public.start_persona_session($1, 'meera', 15, 15) as r`, [alice])).toBeNull();
    expect(await credits(db, alice)).toBe(10);
    await one(db, `select public.start_persona_session($1, 'meera', 5, 5) as r`, [alice]);
    await db.query(`update public.persona_sessions set ends_at = now() - interval '1 minute'`);
    expect(await one<boolean>(db, `select public.use_session_message($1, 'meera', 30) as r`, [alice])).toBe(false);
  });

  it('only the server can call these; users can read their own sessions', async () => {
    for (const sql of [
      `select public.spend_credits($1, 1, 'persona_message')`,
      `select public.refund_credits($1, 100)`,
      `select public.start_persona_session($1, 'meera', 5, 0)`,
      `select public.use_session_message($1, 'meera', 30)`,
    ]) {
      await expect(asUser(db, alice, () => db.query(sql, [alice]))).rejects.toThrow(/permission denied/);
    }
    await one(db, `select public.start_persona_session($1, 'meera', 5, 5) as r`, [alice]);
    const mine = await asUser(db, alice, async () => (await db.query(`select persona_id, minutes from public.persona_sessions`)).rows);
    expect(mine).toEqual([{ persona_id: 'meera', minutes: 5 }]);
  });

  it('rejects odd amounts and reasons', async () => {
    await expect(asServer(db, () => db.query(`select public.spend_credits($1, 0, 'persona_message')`, [alice]))).rejects.toThrow(/invalid/);
    await expect(asServer(db, () => db.query(`select public.spend_credits($1, 1, 'gift')`, [alice]))).rejects.toThrow(/invalid/);
  });
});
