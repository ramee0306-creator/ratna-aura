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
const KEY = 'a'.repeat(64);
const unlock = async (db: PGlite, user: string, price = 20, premiumIncluded = true, key = KEY) =>
  (await asServer(db, () => db.query<{ r: string }>(`select public.unlock_feature($1, 'numbers', $2, $3, $4) as r`, [user, key, price, premiumIncluded]))).rows[0].r;
const credits = async (db: PGlite, user: string) =>
  (await db.query<{ credits: number }>(`select credits from public.wallets where user_id = $1`, [user])).rows[0]?.credits ?? 0;
const give = (db: PGlite, user: string, n: number) => asServer(db, () => db.query(`select public.add_credits($1, $2, 'gift')`, [user, n]));

describe('paid tools', () => {
  let db: PGlite;
  let alice: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
  });

  it('needs enough credits, takes them once, and stays unlocked', async () => {
    expect(await unlock(db, alice)).toBe('none');
    await give(db, alice, 25);
    expect(await unlock(db, alice)).toBe('paid');
    expect(await credits(db, alice)).toBe(5);
    expect(await unlock(db, alice)).toBe('already');
    expect(await credits(db, alice)).toBe(5);
    expect(await unlock(db, alice, 20, true, 'b'.repeat(64))).toBe('none');
  });

  it('is included in Premium, and free tools cost nothing', async () => {
    await asServer(db, () => db.query(`select public.set_subscription($1, 'monthly', 'active', now() + interval '30 days', true, false, 'test', null)`, [alice]));
    expect(await unlock(db, alice)).toBe('premium');
    expect(await unlock(db, alice, 20, false, 'b'.repeat(64))).toBe('none');
    expect(await unlock(db, alice, 0, false, 'c'.repeat(64))).toBe('free');
  });

  it('gives the credits back when the work could not be done', async () => {
    await give(db, alice, 30);
    expect(await unlock(db, alice, 30)).toBe('paid');
    await asServer(db, () => db.query(`select public.undo_unlock($1, 'numbers', $2)`, [alice, KEY]));
    expect(await credits(db, alice)).toBe(30);
    expect(await unlock(db, alice, 30)).toBe('paid');
  });

  it('users can read their unlocks but not create them', async () => {
    await give(db, alice, 30);
    await unlock(db, alice);
    const mine = await asUser(db, alice, () => db.query(`select feature from public.unlocks`));
    expect(mine.rows).toEqual([{ feature: 'numbers' }]);
    await expect(asUser(db, alice, () => db.query(`insert into public.unlocks (user_id, feature, key_hash, paid_with) values ($1, 'kundli', $2, 'free')`, [alice, KEY]))).rejects.toThrow();
    await expect(asUser(db, alice, () => db.query(`select public.unlock_feature($1, 'kundli', $2, 0, false)`, [alice, KEY]))).rejects.toThrow();
    await expect(asUser(db, alice, () => db.query(`select * from public.palm_readings`))).rejects.toThrow();
  });
});

describe('palm reading tickets (pay first, then photos)', () => {
  let db: PGlite;
  let alice: string;
  const buy = async (user: string, price = 30, premiumIncluded = true) =>
    (await asServer(db, () => db.query<{ t: string | null }>(`select public.buy_palm_ticket($1, $2, $3) as t`, [user, price, premiumIncluded]))).rows[0].t;
  const use = async (user: string, ticket: string) =>
    (await asServer(db, () => db.query<{ u: boolean }>(`select public.use_palm_ticket($1, $2) as u`, [user, ticket]))).rows[0].u;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
  });

  it('needs enough credits and takes them once for one reading', async () => {
    expect(await buy(alice)).toBeNull();
    await give(db, alice, 40);
    const ticket = (await buy(alice))!;
    expect(ticket).toMatch(/^[0-9a-f-]{36}$/);
    expect(await credits(db, alice)).toBe(10);
    // Paying again before using it gives the same ticket, without charging again.
    expect(await buy(alice)).toBe(ticket);
    expect(await credits(db, alice)).toBe(10);
  });

  it('a ticket is used once; a failed reading gives it back', async () => {
    await give(db, alice, 30);
    const ticket = (await buy(alice))!;
    expect(await use(alice, ticket)).toBe(true);
    expect(await use(alice, ticket)).toBe(false);
    await asServer(db, () => db.query(`select public.release_palm_ticket($1, $2)`, [alice, ticket]));
    expect(await use(alice, ticket)).toBe(true);
    // Used up: the next reading must be paid again.
    expect(await buy(alice)).toBeNull();
  });

  it("cannot use someone else's ticket, and Premium readings cost nothing", async () => {
    const bob = await createUser(db);
    await give(db, alice, 30);
    const ticket = (await buy(alice))!;
    expect(await use(bob, ticket)).toBe(false);
    await asServer(db, () => db.query(`select public.set_subscription($1, 'monthly', 'active', now() + interval '30 days', true, false, 'test', null)`, [bob]));
    expect(await buy(bob)).not.toBeNull();
    expect(await credits(db, bob)).toBe(0);
    await expect(asUser(db, alice, () => db.query(`select * from public.palm_tickets`))).rejects.toThrow();
  });
});
