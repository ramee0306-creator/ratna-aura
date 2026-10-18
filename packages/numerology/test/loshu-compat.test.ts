import { describe, expect, it } from 'vitest';

import { compatibility, kuaNumber, LO_SHU_LAYOUT, loShuGrid } from '../src';

describe('Lo Shu layout', () => {
  it('is a magic square: every row, column and diagonal adds to 15', () => {
    const g = LO_SHU_LAYOUT;
    for (let i = 0; i < 3; i++) {
      expect(g[i][0] + g[i][1] + g[i][2]).toBe(15);
      expect(g[0][i] + g[1][i] + g[2][i]).toBe(15);
    }
    expect(g[0][0] + g[1][1] + g[2][2]).toBe(15);
    expect(g[0][2] + g[1][1] + g[2][0]).toBe(15);
  });
});

describe('Kua number', () => {
  it.each([
    [1990, 1, 8],
    [1985, 6, 9],
    [1977, 2, 1], // male 5 becomes 2
    [2000, 9, 6],
    [2008, 1, 8], // female 5 becomes 8
    [2010, 8, 7],
  ])('%i: male %i, female %i', (year, male, female) => {
    expect(kuaNumber(year, 'male')).toBe(male);
    expect(kuaNumber(year, 'female')).toBe(female);
  });
});

describe('Lo Shu grid', () => {
  it('14 Aug 1990: date digits + Bhagyank 5 + Mulank 5', () => {
    const grid = loShuGrid({ year: 1990, month: 8, day: 14 });
    expect(grid.digits).toEqual([1, 4, 8, 1, 9, 9, 5, 5]);
    expect(grid.counts).toEqual({ 1: 2, 2: 0, 3: 0, 4: 1, 5: 2, 6: 0, 7: 0, 8: 1, 9: 2 });
    expect(grid.missing).toEqual([2, 3, 6, 7]);
    expect(grid.repeated).toEqual([
      { number: 1, count: 2 },
      { number: 5, count: 2 },
      { number: 9, count: 2 },
    ]);
    expect(grid.completePlanes).toEqual(['will']); // 9-5-1
    expect(grid.emptyPlanes).toEqual(['action']); // 2-7-6
    expect(grid.kua).toBeNull();
  });

  it('adds the Kua number when gender is given', () => {
    expect(loShuGrid({ year: 1990, month: 8, day: 14 }, { gender: 'male' }).counts[1]).toBe(3);
    expect(loShuGrid({ year: 1990, month: 8, day: 14 }, { gender: 'female' }).counts[8]).toBe(2);
  });

  it('does not add the Mulank again for days 1–9', () => {
    const grid = loShuGrid({ year: 2001, month: 3, day: 7 });
    expect(grid.digits).toEqual([7, 3, 2, 1, 4]); // 0s skipped, + Bhagyank 13 -> 4
    expect(grid.missing).toEqual([5, 6, 8, 9]);
  });
});

describe('compatibility', () => {
  it('same numbers are fully compatible', () => {
    expect(compatibility({ mulank: 5, bhagyank: 5 }, { mulank: 5, bhagyank: 5 })).toEqual({
      score: 100,
      level: 'excellent',
      parts: { mulank: 4, bhagyank: 4, cross: 8 },
    });
  });

  it('Sun & Moon are mutual friends', () => {
    expect(compatibility({ mulank: 1, bhagyank: 1 }, { mulank: 2, bhagyank: 2 }).score).toBe(100);
  });

  it('a difficult pair: 1/2 with 6/8', () => {
    // mulank 1↔6: 0, bhagyank 2↔8: 1, cross 1↔8: 0 + 2↔6: 1 -> 8.75 + 3.75 = 12.5 -> 13
    expect(compatibility({ mulank: 1, bhagyank: 2 }, { mulank: 6, bhagyank: 8 })).toEqual({
      score: 13,
      level: 'challenging',
      parts: { mulank: 0, bhagyank: 1, cross: 1 },
    });
  });

  it('gives the same result whichever person comes first, always 0–100', () => {
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        for (const [c, d] of [[1, 9], [4, 8], [6, 3]]) {
          const x = compatibility({ mulank: a, bhagyank: b }, { mulank: c, bhagyank: d });
          const y = compatibility({ mulank: c, bhagyank: d }, { mulank: a, bhagyank: b });
          expect(x).toEqual(y);
          expect(x.score).toBeGreaterThanOrEqual(0);
          expect(x.score).toBeLessThanOrEqual(100);
        }
      }
    }
  });
});
