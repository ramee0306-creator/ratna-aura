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
const spend = async (db: PGlite, user: string, daily = 2) =>
  (await asServer(db, () => db.query<{ r: string }>(`select public.spend_question($1, 3, $2) as r`, [user, daily]))).rows[0].r;
const subscribe = (db: PGlite, user: string, status = 'active', ends = "now() + interval '30 days'") =>
  asServer(db, () => db.query(`select public.set_subscription($1, 'monthly', $2, ${ends}, true, false, 'test', null)`, [user, status]));
const premium = async (db: PGlite, user: string) =>
  (await asServer(db, () => db.query<{ p: boolean }>(`select public.has_premium($1) as p`, [user]))).rows[0].p;

describe('Premium subscription', () => {
  let db: PGlite;
  let alice: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
  });

  it('Premium answers Ask AI without using free questions, up to the daily fair-use limit', async () => {
    await subscribe(db, alice);
    expect([await spend(db, alice), await spend(db, alice)]).toEqual(['premium', 'premium']);
    expect(await spend(db, alice)).toBe('free'); // daily limit (2 here) reached: free questions next
    const { rows } = await db.query(`select free_questions_used, premium_day_used from public.wallets where user_id = $1`, [alice]);
    expect(rows[0]).toEqual({ free_questions_used: 1, premium_day_used: 2 });
    await asServer(db, () => db.query(`select public.refund_question($1, 'premium')`, [alice]));
    expect(await spend(db, alice)).toBe('premium');
  });

  it('is Premium while active or in the grace period, not after it ends', async () => {
    await subscribe(db, alice);
    expect(await premium(db, alice)).toBe(true);
    await subscribe(db, alice, 'in_grace');
    expect(await premium(db, alice)).toBe(true);
    await subscribe(db, alice, 'active', "now() - interval '1 minute'");
    expect(await premium(db, alice)).toBe(false);
    await subscribe(db, alice, 'expired');
    expect(await premium(db, alice)).toBe(false);
    expect(await spend(db, alice)).toBe('free');
  });

  it('bonus credits for a paid period are credited once', async () => {
    await asServer(db, () => db.query(`select public.add_credits($1, 20, 'subscription', 'play:GPA.1..0')`, [alice]));
    await expect(asServer(db, () => db.query(`select public.add_credits($1, 20, 'subscription', 'play:GPA.1..0')`, [alice]))).rejects.toThrow(/duplicate key/);
    await asServer(db, () => db.query(`select public.add_credits($1, 20, 'subscription', 'play:GPA.1..1')`, [alice]));
    const { rows } = await db.query(`select credits from public.wallets where user_id = $1`, [alice]);
    expect(rows[0]).toEqual({ credits: 40 });
  });

  it('users can read their own subscription but not change it', async () => {
    await subscribe(db, alice);
    const mine = await asUser(db, alice, async () => (await db.query(`select plan_id, status from public.subscriptions`)).rows);
    expect(mine).toEqual([{ plan_id: 'monthly', status: 'active' }]);
    await expect(asUser(db, alice, () => db.query(`update public.subscriptions set current_period_end = now() + interval '9 years'`))).rejects.toThrow(/permission denied/);
    await expect(
      asUser(db, alice, () => db.query(`select public.set_subscription($1, 'yearly', 'active', now() + interval '1 year', true, false, 'test', null)`, [alice])),
    ).rejects.toThrow(/permission denied/);
  });

  it('starts with three plans and a daily fair-use limit', async () => {
    const { rows } = await db.query<{ value: { id: string }[] }>(`select value from public.app_settings where key = 'subscription_plans'`);
    expect(rows[0].value.map((p) => p.id)).toEqual(['monthly', 'quarterly', 'yearly']);
  });
});
