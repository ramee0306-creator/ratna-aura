import { describe, expect, it } from 'vitest';

import { bhagyank, CHALDEAN, coreNumbers, isVowelAt, lifePath, maturity, mulank, nameNumber, personality, PYTHAGOREAN, soulUrge } from '../src';

// Worked examples (checked by hand):
// 14 Aug 1990 -> Mulank 1+4 = 5; Bhagyank 1+4+0+8+1+9+9+0 = 32 -> 5;
//                life path 5 (day) + 8 (month) + 1 (1990 -> 19 -> 10 -> 1) = 14 -> 5
// 01 Jan 1998 -> Bhagyank 0+1+0+1+1+9+9+8 = 29 -> 11 -> 2; life path 1 + 1 + 9 (27) = 11 (master)
// 29 Nov 1985 -> Mulank 2; life path 11 + 11 + 5 (23) = 27 -> 9; Bhagyank 36 -> 9
const AUG_14_1990 = { year: 1990, month: 8, day: 14 };
const JAN_1_1998 = { year: 1998, month: 1, day: 1 };
const NOV_29_1985 = { year: 1985, month: 11, day: 29 };

describe('letter charts', () => {
  it('Chaldean chart has no 9 and covers every letter', () => {
    expect(Object.keys(CHALDEAN)).toHaveLength(26);
    expect(Object.values(CHALDEAN)).not.toContain(9);
    expect([CHALDEAN.A, CHALDEAN.F, CHALDEAN.O, CHALDEAN.Z]).toEqual([1, 8, 7, 7]);
  });

  it('Pythagorean chart counts 1–9 repeatedly', () => {
    expect([PYTHAGOREAN.A, PYTHAGOREAN.I, PYTHAGOREAN.J, PYTHAGOREAN.R, PYTHAGOREAN.S, PYTHAGOREAN.Z]).toEqual([1, 9, 1, 9, 1, 8]);
  });

  it('treats Y as a vowel only when it is not next to another vowel', () => {
    expect(isVowelAt('MYRA', 1)).toBe(true);
    expect(isVowelAt('LYNN', 1)).toBe(true);
    expect(isVowelAt('YASH', 0)).toBe(false);
    expect(isVowelAt('VIJAY', 4)).toBe(false);
    expect(isVowelAt('SHREYA', 4)).toBe(false);
    expect(isVowelAt('AMIT', 0)).toBe(true);
    expect(isVowelAt('AMIT', 1)).toBe(false);
  });
});

describe('date numbers', () => {
  it('Mulank is the birth day reduced', () => {
    expect(mulank(AUG_14_1990)).toBe(5);
    expect(mulank(NOV_29_1985)).toBe(2);
    expect(mulank({ year: 2000, month: 1, day: 22 })).toBe(4); // no master numbers for Mulank
    expect(mulank({ year: 2000, month: 1, day: 7 })).toBe(7);
  });

  it('Bhagyank adds every digit of the date', () => {
    expect(bhagyank(AUG_14_1990)).toBe(5);
    expect(bhagyank(JAN_1_1998)).toBe(2);
    expect(bhagyank(NOV_29_1985)).toBe(9);
  });

  it('life path keeps master numbers', () => {
    expect(lifePath(AUG_14_1990)).toBe(5);
    expect(lifePath(JAN_1_1998)).toBe(11);
    expect(lifePath(NOV_29_1985)).toBe(9);
  });
});

describe('name numbers', () => {
  it('JOHN', () => {
    expect(nameNumber('John', 'chaldean')).toEqual({ compound: 18, number: 9 }); // 1+7+5+5
    expect(nameNumber('John', 'pythagorean')).toEqual({ compound: 20, number: 2 }); // 1+6+8+5
  });

  it('AMIT KUMAR — Chaldean', () => {
    // A1 M4 I1 T4 = 10, K2 U6 M4 A1 R2 = 15 -> 25 -> 7
    expect(nameNumber('Amit Kumar', 'chaldean')).toEqual({ compound: 25, number: 7 });
    expect(soulUrge('Amit Kumar', 'chaldean')).toEqual({ compound: 9, number: 9 }); // A1 I1 U6 A1
    expect(personality('Amit Kumar', 'chaldean')).toEqual({ compound: 16, number: 7 }); // M4 T4 K2 M4 R2
  });

  it('AMIT KUMAR — Pythagorean', () => {
    // A1 M4 I9 T2 = 16, K2 U3 M4 A1 R9 = 19 -> 35 -> 8
    expect(nameNumber('Amit Kumar', 'pythagorean')).toEqual({ compound: 35, number: 8 });
    expect(soulUrge('Amit Kumar', 'pythagorean')).toEqual({ compound: 14, number: 5 }); // A1 I9 U3 A1
    expect(personality('Amit Kumar', 'pythagorean')).toEqual({ compound: 21, number: 3 }); // M4 T2 K2 M4 R9
  });

  it('keeps master numbers in Pythagorean only', () => {
    expect(nameNumber('Ted', 'pythagorean')).toEqual({ compound: 11, number: 11 }); // T2 E5 D4
    expect(nameNumber('Ted', 'chaldean')).toEqual({ compound: 13, number: 4 }); // T4 E5 D4
  });

  it('counts Y correctly in soul urge and personality', () => {
    expect(soulUrge('Myra', 'pythagorean')).toEqual({ compound: 8, number: 8 }); // Y7 A1
    expect(personality('Myra', 'pythagorean')).toEqual({ compound: 13, number: 4 }); // M4 R9
    expect(soulUrge('Yash', 'pythagorean')).toEqual({ compound: 1, number: 1 }); // A1
    expect(personality('Yash', 'pythagorean')).toEqual({ compound: 16, number: 7 }); // Y7 S1 H8
  });

  it('ignores case, spaces, accents and symbols', () => {
    expect(nameNumber('  aMiT   KUMAR. ', 'chaldean')).toEqual(nameNumber('Amit Kumar', 'chaldean'));
  });

  it('soul urge + personality = name total', () => {
    for (const name of ['Amit Kumar', 'Myra Shah', 'Vijay Iyer', 'Lynn']) {
      for (const system of ['chaldean', 'pythagorean'] as const) {
        expect(soulUrge(name, system).compound + personality(name, system).compound).toBe(nameNumber(name, system).compound);
      }
    }
  });
});

describe('maturity and the full set', () => {
  it('maturity adds destiny and name numbers', () => {
    expect(maturity(AUG_14_1990, 'Amit Kumar', 'pythagorean')).toBe(4); // 5 + 8 = 13 -> 4
    expect(maturity(AUG_14_1990, 'Amit Kumar', 'chaldean')).toBe(3); // 5 + 7 = 12 -> 3
  });

  it('coreNumbers returns everything', () => {
    expect(coreNumbers('Amit Kumar', AUG_14_1990, 'chaldean')).toEqual({
      mulank: 5,
      bhagyank: 5,
      lifePath: 5,
      name: { compound: 25, number: 7 },
      soulUrge: { compound: 9, number: 9 },
      personality: { compound: 16, number: 7 },
      maturity: 3,
    });
  });
});
