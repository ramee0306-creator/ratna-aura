import { describe, expect, it } from 'vitest';

import { decryptJson, encryptJson, importKey, keyRingFromEnv } from './crypto';

const KEY_A = Buffer.alloc(32, 7).toString('base64');
const KEY_B = Buffer.alloc(32, 9).toString('base64');
const env = (values: Record<string, string>) => (name: string) => values[name];

describe('personal-data encryption', () => {
  it('round-trips a birth record', async () => {
    const ring = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A }));
    const record = { fullName: 'राम कुमार', birthDate: '1990-01-15', birthTime: '06:30' };
    const stored = await encryptJson(ring, record, 'user-1');
    expect(stored).toMatch(/^v1\./);
    expect(stored).not.toContain('1990');
    expect(await decryptJson(ring, stored, 'user-1')).toEqual(record);
  });

  it('uses a fresh random IV every time', async () => {
    const ring = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A }));
    const a = await encryptJson(ring, { x: 1 }, 'u');
    const b = await encryptJson(ring, { x: 1 }, 'u');
    expect(a).not.toEqual(b);
  });

  it("refuses to decrypt data copied onto another user's row", async () => {
    const ring = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A }));
    const stored = await encryptJson(ring, { secret: true }, 'user-1');
    await expect(decryptJson(ring, stored, 'user-2')).rejects.toThrow();
  });

  it('refuses to decrypt with the wrong key', async () => {
    const stored = await encryptJson(await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A })), { a: 1 }, 'u');
    const other = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_B }));
    await expect(decryptJson(other, stored, 'u')).rejects.toThrow();
  });

  it('supports key rotation: new data uses the newest key, old data still opens', async () => {
    const oldRing = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A }));
    const oldStored = await encryptJson(oldRing, { old: true }, 'u');
    const ring = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A, DATA_ENCRYPTION_KEY_V2: KEY_B }));
    expect(await encryptJson(ring, { n: 1 }, 'u')).toMatch(/^v2\./);
    expect(await decryptJson(ring, oldStored, 'u')).toEqual({ old: true });
  });

  it('rejects missing or badly sized keys', async () => {
    await expect(keyRingFromEnv(env({}))).rejects.toThrow(/DATA_ENCRYPTION_KEY/);
    await expect(importKey(Buffer.alloc(16).toString('base64'))).rejects.toThrow(/32 random bytes/);
  });

  it('produces values the database check constraint accepts', async () => {
    const ring = await keyRingFromEnv(env({ DATA_ENCRYPTION_KEY: KEY_A }));
    const stored = await encryptJson(ring, { a: 1 }, 'u');
    expect(stored).toMatch(/^v[0-9]+\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
  });
});
