import { describe, expect, it } from 'vitest';

import { businessVibration, cleanMobile, harmony, houseVibration, mobileVibration, nameNumber, suggestNameSpellings, vehicleVibration } from '../src';

const MERCURY_PERSON = { mulank: 5, bhagyank: 5 }; // supportive numbers: 1, 4, 5, 6

describe('name correction', () => {
  const result = suggestNameSpellings('amit kumar', MERCURY_PERSON);

  it('describes the current spelling', () => {
    expect(result.current).toEqual({ spelling: 'Amit Kumar', compound: 25, number: 7, harmony: 'neutral', changes: 0 });
  });

  it('finds "Amit Koomar" (U -> OO adds 8: 25 + 8 = 33 -> 6)', () => {
    expect(result.suggestions).toContainEqual({ spelling: 'Amit Koomar', compound: 33, number: 6, harmony: 'supportive', changes: 1 });
  });

  it('only suggests supportive spellings, fewest changes first, with correct numbers', () => {
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions.length).toBeLessThanOrEqual(8);
    let lastChanges = 1;
    for (const s of result.suggestions) {
      expect(s.harmony).toBe('supportive');
      expect(harmony(s.number, MERCURY_PERSON)).toBe('supportive');
      expect(nameNumber(s.spelling, 'chaldean').number).toBe(s.number);
      expect(s.changes).toBeGreaterThanOrEqual(lastChanges);
      lastChanges = s.changes;
      expect(s.spelling).not.toBe('Amit Kumar');
    }
    expect(new Set(result.suggestions.map((s) => s.spelling)).size).toBe(result.suggestions.length);
  });

  it('rejects names without English letters', () => {
    expect(() => suggestNameSpellings('१२३', MERCURY_PERSON)).toThrow();
  });
});

describe('mobile numbers', () => {
  it('cleans Indian numbers', () => {
    expect(cleanMobile('+91 98765 43210')).toBe('9876543210');
    expect(cleanMobile('09876543210')).toBe('9876543210');
    expect(cleanMobile('98765-43210')).toBe('9876543210');
    expect(cleanMobile('12345')).toBeNull();
    expect(cleanMobile('5876543210')).toBeNull(); // Indian mobiles start with 6–9
  });

  it('98765 43210: total 45 -> 9', () => {
    expect(mobileVibration('+91 98765 43210', MERCURY_PERSON)).toEqual({
      digits: '9876543210',
      compound: 45,
      number: 9,
      harmony: 'neutral', // Mercury regards Mars as neutral
      zeros: 1,
      lastDigit: 0,
    });
    expect(mobileVibration('+91 98765 43210')?.harmony).toBeNull();
    expect(mobileVibration('123')).toBeNull();
  });
});

describe('vehicle, house and business', () => {
  it('vehicle MH 12 AB 1234: digits 13 -> 4; with letters 25 -> 7', () => {
    const v = vehicleVibration('MH 12 AB 1234');
    expect(v).toMatchObject({ plate: 'MH12AB1234', compound: 13, number: 4 });
    expect(v?.withLetters).toMatchObject({ compound: 25, number: 7 }); // + M4 H5 A1 B2
    expect(vehicleVibration('AB')).toBeNull();
  });

  it('house B-402: B2 + 4 + 0 + 2 = 8', () => {
    expect(houseVibration('B-402')).toEqual({ compound: 8, number: 8, harmony: null });
    expect(houseVibration('Flat')).toBeNull();
  });

  it('business "Tata": T4 A1 T4 A1 = 10 -> 1', () => {
    expect(businessVibration('Tata', MERCURY_PERSON)).toEqual({ compound: 10, number: 1, harmony: 'supportive' });
    expect(businessVibration('123')).toBeNull();
  });
});

describe('name correction spelling rules', () => {
  it('returns no suggestions when the current name already suits the person best', () => {
    // Sun (1) and Moon (2) both regard 2 highly: Priya Sharma = 47 -> 11 -> 2
    expect(suggestNameSpellings('Priya Sharma', { mulank: 1, bhagyank: 2 }).suggestions).toEqual([]);
  });

  it('never suggests awkward spellings', () => {
    const people = [
      { mulank: 8, bhagyank: 8 },
      { mulank: 5, bhagyank: 5 },
      { mulank: 4, bhagyank: 7 },
      { mulank: 9, bhagyank: 3 },
    ];
    for (const name of ['Priya Sharma', 'Amit Kumar', 'Siddharth Rao', 'Neha Gupta', 'Arjun Mehta']) {
      for (const person of people) {
        for (const s of suggestNameSpellings(name, person, { limit: 50 }).suggestions) {
          for (const word of s.spelling.toUpperCase().split(' ')) {
            expect(word, s.spelling).not.toMatch(/^([^AEIOU])\1/); // no "Ppriya" (but "Aamit" is fine)
            expect(word, s.spelling).not.toMatch(/[AEIOU]{3}/); // no "Raooo"
            expect(word, s.spelling).not.toMatch(/[BCDGJKPST]H[BCDFGJKLMNPQRSTVWXZ]/); // no "Phriya"
            expect(word, s.spelling).not.toMatch(/(.)\1\1/); // no triple letters
          }
        }
      }
    }
  });
});
