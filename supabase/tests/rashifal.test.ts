import type { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';

import { asUser, createUser, freshDatabase } from './supabase-stub';

describe('rashifal & app settings database rules', () => {
  let db: PGlite;
  let alice: string;

  beforeEach(async () => {
    db = await freshDatabase();
    alice = await createUser(db);
  });

  it('the app cannot read or write the rashifal table directly', async () => {
    await db.query(`insert into public.rashifal (day, sign, language, status, content) values ('2026-10-19', 0, 'hi', 'ready', '{}')`);
    for (const who of [alice, null]) {
      await expect(asUser(db, who, () => db.query(`select * from public.rashifal`))).rejects.toThrow(/permission denied/);
      await expect(
        asUser(db, who, () => db.query(`insert into public.rashifal (day, sign, language) values ('2026-10-20', 1, 'en')`)),
      ).rejects.toThrow(/permission denied/);
    }
  });

  it('only one reading per day, sign and language', async () => {
    await db.query(`insert into public.rashifal (day, sign, language) values ('2026-10-19', 3, 'ta')`);
    await expect(db.query(`insert into public.rashifal (day, sign, language) values ('2026-10-19', 3, 'ta')`)).rejects.toThrow(/duplicate key/);
  });

  it('a ready reading must have its text, and signs are 0–11', async () => {
    await expect(db.query(`insert into public.rashifal (day, sign, language, status) values ('2026-10-19', 0, 'en', 'ready')`)).rejects.toThrow(/check/);
    await expect(db.query(`insert into public.rashifal (day, sign, language) values ('2026-10-19', 12, 'en')`)).rejects.toThrow(/check/);
  });

  it('app settings start with the AI models and are hidden from the app', async () => {
    const { rows } = await db.query(`select key, value from public.app_settings order by key`);
    expect(rows).toEqual([
      { key: 'chat_model', value: 'claude-opus-5-5' },
      { key: 'rashifal_model', value: 'claude-opus-5-5' },
    ]);
    await expect(asUser(db, alice, () => db.query(`select * from public.app_settings`))).rejects.toThrow(/permission denied/);
  });

  it('a user can now save any of the app languages, but not made-up ones', async () => {
    await asUser(db, alice, () => db.query(`update public.profiles set preferred_language = 'tcy' where id = $1`, [alice]));
    await expect(
      asUser(db, alice, () => db.query(`update public.profiles set preferred_language = 'xx' where id = $1`, [alice])),
    ).rejects.toThrow(/check/);
  });
});
