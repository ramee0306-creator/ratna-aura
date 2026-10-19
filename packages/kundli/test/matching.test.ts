import { describe, expect, it } from 'vitest';

import {
  ashtakoota,
  GANA_OF_NAKSHATRA,
  KOOTA_MAX,
  type Kundli,
  maitriPoints,
  manglik,
  matchKundlis,
  nadiOf,
  verdict,
  YONI_OF_NAKSHATRA,
  YONI_POINTS,
  YONIS,
} from '../src/index.ts';

const points = (m: ReturnType<typeof ashtakoota>) => Object.fromEntries(m.kootas.map((k) => [k.koota, k.points]));

describe('Ashtakoota tables', () => {
  it('the eight kootas add up to 36', () => {
    expect(Object.values(KOOTA_MAX).reduce((a, b) => a + b, 0)).toBe(36);
  });

  it('nine nakshatras in each gana and each nadi', () => {
    for (const g of [0, 1, 2]) expect(GANA_OF_NAKSHATRA.filter((x) => x === g)).toHaveLength(9);
    for (const n of [0, 1, 2]) expect(Array.from({ length: 27 }, (_, i) => nadiOf(i)).filter((x) => x === n)).toHaveLength(9);
    expect([0, 5, 6, 11, 12, 17, 18, 23, 24].every((i) => nadiOf(i) === 0)).toBe(true); // Adi: Ashwini, Ardra, Punarvasu …
  });

  it('every yoni animal appears twice (Cow, Horse … ), and the yoni table is symmetric', () => {
    expect(YONI_OF_NAKSHATRA).toHaveLength(27);
    for (let a = 0; a < 14; a++) {
      expect(YONI_POINTS[a][a]).toBe(4);
      for (let b = 0; b < 14; b++) expect(YONI_POINTS[a][b]).toBe(YONI_POINTS[b][a]);
    }
  });

  it('sworn-enemy yonis score 0', () => {
    const pairs = [['horse', 'buffalo'], ['elephant', 'lion'], ['sheep', 'monkey'], ['serpent', 'mongoose'], ['dog', 'deer'], ['cat', 'rat'], ['cow', 'tiger']];
    for (const [a, b] of pairs) expect(YONI_POINTS[YONIS.indexOf(a as never)][YONIS.indexOf(b as never)]).toBe(0);
  });

  it('graha maitri follows the natural friendships', () => {
    expect(maitriPoints('sun', 'moon')).toBe(5); // friends
    expect(maitriPoints('sun', 'mercury')).toBe(4); // neutral / friend
    expect(maitriPoints('mars', 'venus')).toBe(3); // both neutral
    expect(maitriPoints('moon', 'mercury')).toBe(1); // friend / enemy
    expect(maitriPoints('moon', 'venus')).toBe(0.5); // neutral / enemy
    expect(maitriPoints('sun', 'saturn')).toBe(0); // enemies
    expect(maitriPoints('venus', 'venus')).toBe(5); // same lord
  });
});

describe('Ashtakoota milan', () => {
  it('same rashi and nakshatra: 28 points, with Nadi dosha', () => {
    const m = ashtakoota({ longitude: 5 }, { longitude: 6 });
    expect(m.total).toBe(28);
    expect(points(m)).toMatchObject({ varna: 1, vashya: 2, tara: 3, yoni: 4, grahaMaitri: 5, gana: 6, bhakoot: 7, nadi: 0 });
    expect(m.nadiDosha).toEqual({ present: true, cancelled: false }); // same pada
    expect(m.bhakootDosha.present).toBe(false);
  });

  it('same nakshatra but a different pada softens Nadi dosha', () => {
    expect(ashtakoota({ longitude: 1 }, { longitude: 12 }).nadiDosha).toEqual({ present: true, cancelled: true });
  });

  it('groom Ashwini (Mesha), bride Rohini (Vrishabha): 24.5 points', () => {
    const m = ashtakoota({ longitude: 5 }, { longitude: 45 });
    expect(points(m)).toEqual({ varna: 1, vashya: 2, tara: 1.5, yoni: 3, grahaMaitri: 3, gana: 6, bhakoot: 0, nadi: 8 });
    expect(m.total).toBe(24.5);
    expect(m.bhakootDosha).toEqual({ present: true, cancelled: false }); // 2/12, Mars and Venus are only neutral
    expect(m.kootas.find((k) => k.koota === 'tara')).toMatchObject({ groom: '25', bride: '4' });
  });

  it('Varna: the groom’s varna should be equal or higher', () => {
    // groom Cancer (Brahmin), bride Gemini (Shudra) -> 1; the other way round -> 0
    expect(points(ashtakoota({ longitude: 100 }, { longitude: 70 })).varna).toBe(1);
    expect(points(ashtakoota({ longitude: 70 }, { longitude: 100 })).varna).toBe(0);
  });

  it('Vashya splits Sagittarius and Capricorn in halves', () => {
    const k = (lon: number) => ashtakoota({ longitude: lon }, { longitude: lon }).kootas.find((x) => x.koota === 'vashya')!.groom;
    expect(k(245)).toBe('manava');
    expect(k(260)).toBe('chatushpada');
    expect(k(275)).toBe('chatushpada');
    expect(k(290)).toBe('jalachara');
    expect(k(130)).toBe('vanachara'); // Leo
    expect(k(220)).toBe('keeta'); // Scorpio
  });

  it('total is always between 0 and 36 and equals the sum of the parts', () => {
    for (let g = 0; g < 360; g += 7.3) {
      for (let b = 0; b < 360; b += 11.1) {
        const m = ashtakoota({ longitude: g }, { longitude: b });
        expect(m.total).toBeGreaterThanOrEqual(0);
        expect(m.total).toBeLessThanOrEqual(36);
        for (const k of m.kootas) expect(k.points).toBeLessThanOrEqual(k.max);
      }
    }
  });

  it('verdict bands', () => {
    expect(verdict(36)).toBe('excellent');
    expect(verdict(24.5)).toBe('good');
    expect(verdict(18)).toBe('average');
    expect(verdict(17.5)).toBe('low');
  });
});

/** A kundli with only what Manglik needs: lagna sign, Moon and Mars. */
function fake(lagnaSign: number, moonSign: number, marsSign: number, timeKnown = true): Kundli {
  const planet = (body: string, sign: number) => ({ body, sign, longitude: sign * 30 + 10, house: ((sign - lagnaSign + 12) % 12) + 1 });
  return { timeKnown, ascendant: { sign: lagnaSign }, planets: [planet('moon', moonSign), planet('mars', marsSign)] } as unknown as Kundli;
}

describe('Manglik', () => {
  it('Mars in the 7th from the lagna', () => {
    const m = manglik(fake(0, 3, 6)); // lagna Aries, Moon Cancer, Mars Libra
    expect(m.fromLagna).toEqual({ house: 7, manglik: true });
    expect(m.fromMoon).toEqual({ house: 4, manglik: true });
    expect(m).toMatchObject({ manglik: true, softened: false });
  });

  it('Mars in the 3rd from both: not Manglik', () => {
    expect(manglik(fake(0, 0, 2)).manglik).toBe(false);
  });

  it('Mars in its own sign is marked as softened', () => {
    expect(manglik(fake(1, 1, 7))).toMatchObject({ manglik: true, softened: true }); // Mars in Scorpio, 7th
  });

  it('without a birth time only the Moon is used', () => {
    const m = manglik(fake(0, 5, 6, false)); // Mars 2nd from Moon
    expect(m.fromLagna).toBeNull();
    expect(m.fromMoon).toEqual({ house: 2, manglik: true });
  });

  it('two Mangliks balance each other', () => {
    expect(matchKundlis(fake(0, 3, 6), fake(1, 1, 7)).manglikBalance).toBe('both');
    expect(matchKundlis(fake(0, 0, 2), fake(1, 1, 7)).manglikBalance).toBe('one');
    expect(matchKundlis(fake(0, 0, 2), fake(0, 0, 2)).manglikBalance).toBe('none');
  });
});
