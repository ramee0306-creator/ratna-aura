import { describe, expect, it } from 'vitest';

import { cleanPrices, isFeature, keyHash } from './unlocks.ts';

describe('paid tools', () => {
  it('keeps only valid prices for known tools', () => {
    expect(cleanPrices({ kundli: 40, milan: -1, palm: 2.5, rashifal: 0, nope: 5 })).toEqual({ kundli: 40, rashifal: 0 });
    expect(cleanPrices(null)).toEqual({});
  });

  it('knows its tools', () => {
    expect(isFeature('palm')).toBe(true);
    expect(isFeature('admin')).toBe(false);
  });

  it('hashes what was unlocked, ignoring case and spaces at the ends', async () => {
    const a = await keyHash('numbers', ' Priya Sharma|1990-05-14 ');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await keyHash('numbers', 'priya sharma|1990-05-14')).toBe(a);
    expect(await keyHash('loshu', 'priya sharma|1990-05-14')).not.toBe(a);
  });
});
