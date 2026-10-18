import type { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';

import { asUser, createUser, freshDatabase } from './supabase-stub';

const FAKE_CIPHERTEXT = 'v1.AAAAAAAAAAAAAAAA.BBBBBBBBBBBB';

describe('accounts & birth profiles database rules', () => {
  let db: PGlite;
  let alice: string;
  let bob: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
    bob = await createUser(db);
  });

  it('creates a profile row automatically for each new user', async () => {
    const { rows } = await db.query(`select id, preferred_language from public.profiles order by id`);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ preferred_language: 'en' });
  });

  it('lets a user read only their own profile', async () => {
    const rows = await asUser(db, alice, async () => (await db.query(`select id from public.profiles`)).rows);
    expect(rows).toEqual([{ id: alice }]);
  });

  it('hides all profiles from signed-out visitors', async () => {
    await expect(asUser(db, null, () => db.query(`select * from public.profiles`))).rejects.toThrow(
      /permission denied/,
    );
  });

  it('lets a user change their name and language, but not consent fields', async () => {
    await asUser(db, alice, () =>
      db.query(`update public.profiles set display_name = 'Alice', preferred_language = 'hi' where id = $1`, [alice]),
    );
    const { rows } = await db.query(`select display_name, preferred_language from public.profiles where id = $1`, [
      alice,
    ]);
    expect(rows[0]).toEqual({ display_name: 'Alice', preferred_language: 'hi' });

    await expect(
      asUser(db, alice, () => db.query(`update public.profiles set consent_version = 99 where id = $1`, [alice])),
    ).rejects.toThrow(/permission denied/);
  });

  it("cannot change someone else's profile", async () => {
    await asUser(db, alice, () => db.query(`update public.profiles set display_name = 'hacked' where id = $1`, [bob]));
    const { rows } = await db.query(`select display_name from public.profiles where id = $1`, [bob]);
    expect(rows[0].display_name).toBeNull();
  });

  it('records 18+ confirmation and consent through accept_terms', async () => {
    await asUser(db, alice, () => db.query(`select public.accept_terms(1, true)`));
    const { rows } = await db.query<{ consent_version: number; age_confirmed_at: Date | null }>(
      `select consent_version, age_confirmed_at from public.profiles where id = $1`,
      [alice],
    );
    expect(rows[0].consent_version).toBe(1);
    expect(rows[0].age_confirmed_at).not.toBeNull();
  });

  it('refuses accept_terms for under-18 users and signed-out visitors', async () => {
    await expect(asUser(db, alice, () => db.query(`select public.accept_terms(1, false)`))).rejects.toThrow(/18/);
    await expect(asUser(db, null, () => db.query(`select public.accept_terms(1, true)`))).rejects.toThrow(
      /permission denied/,
    );
  });

  it('blocks the app from reading or writing birth profiles directly', async () => {
    await db.query(`insert into public.birth_profiles (owner_id, data_enc) values ($1, $2)`, [alice, FAKE_CIPHERTEXT]);
    await expect(asUser(db, alice, () => db.query(`select * from public.birth_profiles`))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      asUser(db, alice, () =>
        db.query(`insert into public.birth_profiles (owner_id, data_enc) values ($1, $2)`, [alice, FAKE_CIPHERTEXT]),
      ),
    ).rejects.toThrow(/permission denied/);
  });

  it('only accepts encrypted data in birth profiles', async () => {
    await expect(
      db.query(`insert into public.birth_profiles (owner_id, data_enc) values ($1, $2)`, [alice, '{"name":"Alice"}']),
    ).rejects.toThrow(/check constraint/);
  });

  it('allows only one primary profile per user', async () => {
    await db.query(`insert into public.birth_profiles (owner_id, data_enc, is_primary) values ($1, $2, true)`, [
      alice,
      FAKE_CIPHERTEXT,
    ]);
    await expect(
      db.query(`insert into public.birth_profiles (owner_id, data_enc, is_primary) values ($1, $2, true)`, [
        alice,
        FAKE_CIPHERTEXT,
      ]),
    ).rejects.toThrow(/unique/);
  });

  it('limits each account to 20 saved profiles', async () => {
    for (let i = 0; i < 20; i++) {
      await db.query(`insert into public.birth_profiles (owner_id, data_enc) values ($1, $2)`, [alice, FAKE_CIPHERTEXT]);
    }
    await expect(
      db.query(`insert into public.birth_profiles (owner_id, data_enc) values ($1, $2)`, [alice, FAKE_CIPHERTEXT]),
    ).rejects.toThrow(/up to 20/);
  });

  it('deletes all of a user’s data when their account is deleted', async () => {
    await db.query(`insert into public.birth_profiles (owner_id, data_enc) values ($1, $2)`, [alice, FAKE_CIPHERTEXT]);
    await db.query(`delete from auth.users where id = $1`, [alice]);
    const profiles = await db.query(`select 1 from public.profiles where id = $1`, [alice]);
    const births = await db.query(`select 1 from public.birth_profiles where owner_id = $1`, [alice]);
    expect(profiles.rows).toHaveLength(0);
    expect(births.rows).toHaveLength(0);
  });
});
