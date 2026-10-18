import { describe, expect, it } from 'vitest';

import { harmony, harmonyScore, luckyFactors, NUMBER_PLANET, numberRelation, personalCycles, personalDay, personalMonth, personalYear, PLANET_NUMBER, planetOf, planetRelation } from '../src';

describe('personal year, month and day', () => {
  const birth = { year: 1990, month: 8, day: 14 };

  it('born 14 Aug, on 18 Oct 2026', () => {
    expect(personalYear(birth, 2026)).toBe(5); // 1+4 + 8 + 2+0+2+6 = 23 -> 5
    expect(personalMonth(birth, 2026, 10)).toBe(6); // 5 + 10 = 15 -> 6
    expect(personalDay(birth, { year: 2026, month: 10, day: 18 })).toBe(6); // 6 + 18 = 24 -> 6
    expect(personalCycles(birth, { year: 2026, month: 10, day: 18 })).toEqual({ year: 5, month: 6, day: 6 });
  });

  it('born 1 Jan, on 31 Dec 2026', () => {
    const jan1 = { year: 1998, month: 1, day: 1 };
    expect(personalYear(jan1, 2026)).toBe(3); // 1 + 1 + 10 = 12 -> 3
    expect(personalMonth(jan1, 2026, 12)).toBe(6); // 3 + 12 = 15 -> 6
    expect(personalDay(jan1, { year: 2026, month: 12, day: 31 })).toBe(1); // 6 + 31 = 37 -> 10 -> 1
  });

  it('the birth year itself does not matter', () => {
    expect(personalYear({ year: 1950, month: 8, day: 14 }, 2026)).toBe(personalYear(birth, 2026));
  });
});

describe('planets', () => {
  it('maps numbers to planets both ways', () => {
    expect(NUMBER_PLANET[1]).toBe('sun');
    expect(NUMBER_PLANET[4]).toBe('rahu');
    expect(NUMBER_PLANET[7]).toBe('ketu');
    expect(PLANET_NUMBER.saturn).toBe(8);
    expect(planetOf(19)).toBe('sun'); // 19 -> 10 -> 1
    expect(() => planetOf(0)).toThrow();
  });

  it('uses the classical friendships, which are not always mutual', () => {
    expect(planetRelation('sun', 'moon')).toBe('friend');
    expect(planetRelation('moon', 'sun')).toBe('friend');
    expect(planetRelation('jupiter', 'mercury')).toBe('enemy');
    expect(planetRelation('mercury', 'jupiter')).toBe('neutral');
    expect(planetRelation('mercury', 'moon')).toBe('enemy');
    expect(planetRelation('moon', 'mercury')).toBe('friend');
    expect(planetRelation('saturn', 'saturn')).toBe('same');
    expect(numberRelation(1, 8)).toBe('enemy'); // Sun and Saturn
  });

  it('scores how well a number suits a person', () => {
    const person = { mulank: 5, bhagyank: 5 }; // Mercury
    expect(harmonyScore(6, person)).toBe(4);
    expect(harmony(6, person)).toBe('supportive');
    expect(harmony(7, person)).toBe('neutral');
    expect(harmony(2, person)).toBe('challenging');
  });
});

describe('lucky factors', () => {
  it('Mulank 5, Bhagyank 5 (Mercury)', () => {
    expect(luckyFactors({ mulank: 5, bhagyank: 5 })).toEqual({
      planet: 'mercury',
      numbers: [1, 4, 5, 6],
      avoid: [2],
      days: ['sunday', 'wednesday', 'friday', 'saturday'],
      colours: ['green'],
      gem: 'emerald',
    });
  });

  it('Mulank 1, Bhagyank 2 (Sun with Moon)', () => {
    const lucky = luckyFactors({ mulank: 1, bhagyank: 2 });
    expect(lucky.planet).toBe('sun');
    expect(lucky.numbers).toEqual([1, 2, 3, 9]);
    expect(lucky.avoid).toEqual([4, 7]);
    expect(lucky.gem).toBe('ruby');
  });

  it('always includes the Mulank itself unless the Bhagyank opposes it', () => {
    for (let m = 1; m <= 9; m++) {
      for (let b = 1; b <= 9; b++) {
        const lucky = luckyFactors({ mulank: m, bhagyank: b });
        expect(lucky.numbers.includes(m)).toBe(numberRelation(b, m) !== 'enemy');
        expect(lucky.numbers.some((n) => lucky.avoid.includes(n))).toBe(false);
      }
    }
  });
});
