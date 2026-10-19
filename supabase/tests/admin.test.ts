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

describe('admin panel database rules', () => {
  let db: PGlite;
  let alice: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
  });

  it('users cannot make themselves admin', async () => {
    await expect(asUser(db, alice, () => db.query(`update public.profiles set is_admin = true where id = $1`, [alice]))).rejects.toThrow(/permission denied/);
    const { rows } = await asUser(db, alice, () => db.query(`select is_admin from public.profiles`));
    expect(rows).toEqual([{ is_admin: false }]);
  });

  it('stats count users, questions, AI tokens and credits', async () => {
    const { rows: t } = await db.query<{ id: string }>(`insert into public.chat_threads (owner_id) values ($1) returning id`, [alice]);
    await db.query(
      `insert into public.chat_messages (thread_id, owner_id, role, content_enc, model, input_tokens, output_tokens)
       values ($1, $2, 'user', 'x', null, null, null), ($1, $2, 'assistant', 'y', 'claude-haiku-5-5', 1200, 300)`,
      [t[0].id, alice],
    );
    await asServer(db, () => db.query(`select public.add_credits($1, 10, 'test_purchase')`, [alice]));
    const { rows } = await asServer(db, () => db.query<{ s: Record<string, unknown> }>(`select public.admin_stats() as s`));
    expect(rows[0].s).toMatchObject({
      users: 1,
      newUsers7d: 1,
      questionsToday: 1,
      questions7d: 1,
      aiUsage7d: [{ model: 'claude-haiku-5-5', answers: 1, inputTokens: 1200, outputTokens: 300 }],
      testCredits7d: 10,
      creditsBought7d: 0,
    });
  });

  it('finds users by e-mail or phone, for the server only', async () => {
    await db.query(`update auth.users set email = 'Asha@Example.com', phone = '919876543210' where id = $1`, [alice]);
    const find = async (contact: string) => (await asServer(db, () => db.query<{ id: string | null }>(`select public.find_user($1) as id`, [contact]))).rows[0].id;
    expect(await find('asha@example.com')).toBe(alice);
    expect(await find('+91 98765 43210')).toBe(alice);
    expect(await find('nobody@example.com')).toBeNull();
    await expect(asUser(db, alice, () => db.query(`select public.find_user('asha@example.com')`))).rejects.toThrow(/permission denied/);
    await expect(asUser(db, alice, () => db.query(`select public.admin_stats()`))).rejects.toThrow(/permission denied/);
  });
});
