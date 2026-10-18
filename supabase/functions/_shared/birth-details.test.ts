import { describe, expect, it } from 'vitest';

import { splitForStorage, validateBirthProfile } from './birth-details';

const TODAY = new Date('2026-10-18T12:00:00Z');
const valid = {
  fullName: '  Priya   Sharma ',
  gender: 'female',
  relation: 'self',
  isPrimary: true,
  birthDate: '1995-08-23',
  birthTime: '14:05',
  birthPlace: { name: 'Pune, Maharashtra, IN', latitude: 18.5196, longitude: 73.8553, timezone: 'Asia/Kolkata' },
};

describe('birth profile validation', () => {
  it('accepts a complete profile and tidies the name', () => {
    const result = validateBirthProfile(valid, TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.fullName).toBe('Priya Sharma');
  });

  it('accepts an unknown birth time', () => {
    expect(validateBirthProfile({ ...valid, birthTime: null }, TODAY).ok).toBe(true);
  });

  it('accepts names written in Devanagari', () => {
    expect(validateBirthProfile({ ...valid, fullName: 'प्रिया शर्मा' }, TODAY).ok).toBe(true);
  });

  it.each([
    ['impossible date', { birthDate: '1995-02-30' }],
    ['future date', { birthDate: '2027-01-01' }],
    ['wrong date format', { birthDate: '23/08/1995' }],
    ['bad time', { birthTime: '25:00' }],
    ['missing name', { fullName: '   ' }],
    ['unknown gender', { gender: 'x' }],
    ['unknown relation', { relation: 'boss' }],
  ])('rejects %s', (_label, patch) => {
    expect(validateBirthProfile({ ...valid, ...patch }, TODAY).ok).toBe(false);
  });

  it('rejects bad coordinates and time zones', () => {
    const r = validateBirthProfile(
      { ...valid, birthPlace: { name: 'X', latitude: 95, longitude: 200, timezone: 'Mars/Olympus' } },
      TODAY,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toHaveLength(3);
  });

  it('keeps relation and primary flag out of the encrypted part', () => {
    const r = validateBirthProfile(valid, TODAY);
    if (!r.ok) throw new Error('expected valid');
    const { details, columns } = splitForStorage(r.value);
    expect(columns).toEqual({ relation: 'self', is_primary: true });
    expect(details).not.toHaveProperty('relation');
    expect(details.birthPlace.timezone).toBe('Asia/Kolkata');
  });
});
