import { describe, expect, it } from 'vitest';

import { buildKundli, chartBoxes, currentDasha, DASHA_YEARS, type Ephemeris, nakshatraLord, vimshottari, YEAR_MS } from '../src/index.ts';

const BIRTH = Date.UTC(1990, 7, 14, 5, 0);
const years = (ms: number) => ms / YEAR_MS;

describe('Vimshottari dasha', () => {
  it('the nine periods add up to 120 years', () => {
    expect(Object.values(DASHA_YEARS).reduce((a, b) => a + b, 0)).toBe(120);
  });

  it('nakshatra lords repeat every nine nakshatras', () => {
    expect(nakshatraLord(0)).toBe('ketu'); // Ashwini
    expect(nakshatraLord(1)).toBe('venus'); // Bharani
    expect(nakshatraLord(9)).toBe('ketu'); // Magha
    expect(nakshatraLord(26)).toBe('mercury'); // Revati
  });

  it('Moon at the very start of Ashwini: the full 7 years of Ketu remain', () => {
    const d = vimshottari(0, BIRTH);
    expect(d[0].lord).toBe('ketu');
    expect(d[0].start).toBe(BIRTH);
    expect(years(d[0].end - BIRTH)).toBeCloseTo(7, 9);
    expect(d[0].antardashas[0].lord).toBe('ketu');
    expect(years(d[0].antardashas[0].end - BIRTH)).toBeCloseTo((7 * 7) / 120, 9);
    expect(d.map((m) => m.lord)).toEqual(['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury']);
    expect(years(d[8].end - BIRTH)).toBeCloseTo(120, 9);
  });

  it('Moon halfway through Bharani (20°): 10 of Venus’s 20 years remain, starting in the Venus–Rahu antardasha', () => {
    const d = vimshottari(20, BIRTH);
    expect(d[0].lord).toBe('venus');
    expect(years(d[0].end - BIRTH)).toBeCloseTo(10, 9);
    // Venus antardashas from the (pre-birth) start: Ve 3.333, Su 1, Mo 1.667, Ma 1.167 = 7.167 y; Rahu 3 y -> ends at 10.167 y
    expect(d[0].antardashas[0]).toMatchObject({ lord: 'rahu', start: BIRTH });
    expect(years(d[0].antardashas[0].end - BIRTH)).toBeCloseTo(10.1667 - 10, 3);
    expect(d[0].antardashas.map((a) => a.lord)).toEqual(['rahu', 'jupiter', 'saturn', 'mercury', 'ketu']);
    expect(d[0].antardashas.at(-1)!.end).toBeCloseTo(d[0].end, 0);
    expect(d[1].lord).toBe('sun');
  });

  it('antardashas fill each later mahadasha exactly', () => {
    for (const md of vimshottari(123.45, BIRTH).slice(1)) {
      expect(md.antardashas[0].lord).toBe(md.lord);
      expect(md.antardashas[0].start).toBe(md.start);
      expect(md.antardashas.at(-1)!.end).toBeCloseTo(md.end, 0);
    }
  });

  it('finds the running dasha', () => {
    const d = vimshottari(0, BIRTH);
    expect(currentDasha(d, BIRTH + 1)).toEqual({ mahadasha: 'ketu', antardasha: 'ketu' });
    expect(currentDasha(d, BIRTH + 8 * YEAR_MS)?.mahadasha).toBe('venus');
    expect(currentDasha(d, BIRTH + 121 * YEAR_MS)).toBeNull();
  });
});

/** A pretend ephemeris with fixed positions, to test the chart logic on its own. */
const fake: Ephemeris = {
  name: 'test',
  ascendant: () => 175.38, // Virgo 25°23′
  ayanamsa: () => 23.7,
  positions: () => ({
    sun: { longitude: 117.2, speed: 0.96 }, // Cancer
    moon: { longitude: 20, speed: 13 }, // Aries, Bharani
    mars: { longitude: 25, speed: 0.6 }, // Aries
    mercury: { longitude: 140, speed: -0.3 }, // Leo, retrograde
    jupiter: { longitude: 95, speed: 0.2 }, // Cancer (exalted)
    venus: { longitude: 125, speed: 1.1 }, // Leo
    saturn: { longitude: 263, speed: -0.03 }, // Sagittarius, retrograde
    rahu: { longitude: 296, speed: -0.05 }, // Capricorn
  }),
};

describe('building a kundli', () => {
  const k = buildKundli(
    { birthDate: '1990-08-14', birthTime: '10:30', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
    fake,
    BIRTH + 30 * YEAR_MS,
  );

  it('converts the birth time', () => {
    expect(k.utc).toBe('1990-08-14T05:00:00.000Z');
    expect(k.timeKnown).toBe(true);
  });

  it('places the lagna and planets in whole-sign houses', () => {
    expect(k.ascendant).toMatchObject({ sign: 5, nakshatra: 13 }); // Virgo, Chitra (starts at 173°20′)
    const house = (b: string) => k.planets.find((p) => p.body === b)!.house;
    expect(house('sun')).toBe(11); // Cancer is the 11th from Virgo
    expect(house('moon')).toBe(8); // Aries
    expect(house('saturn')).toBe(4); // Sagittarius
    expect(house('rahu')).toBe(5); // Capricorn
    expect(house('ketu')).toBe(11); // Cancer, opposite Rahu
  });

  it('Ketu is opposite Rahu; retrograde and dignity are marked', () => {
    const p = (b: string) => k.planets.find((x) => x.body === b)!;
    expect(p('ketu').longitude).toBeCloseTo(116, 9);
    expect(p('mercury').retrograde).toBe(true);
    expect(p('saturn').retrograde).toBe(true);
    expect(p('rahu').retrograde).toBe(false);
    expect(p('jupiter').dignity).toBe('exalted');
    expect(p('mars').dignity).toBe('own');
  });

  it('starts the dasha from the Moon', () => {
    expect(k.dashas[0].lord).toBe('venus');
    expect(k.current?.mahadasha).toBe(vimshottari(20, BIRTH).find((d) => d.start <= BIRTH + 30 * YEAR_MS && BIRTH + 30 * YEAR_MS < d.end)!.lord);
  });

  it('uses 12:00 noon when the birth time is unknown', () => {
    const noon = buildKundli({ ...k.input, birthTime: null }, fake);
    expect(noon.utc).toBe('1990-08-14T06:30:00.000Z');
    expect(noon.timeKnown).toBe(false);
  });

  it('lays out the birth chart, navamsa and Moon chart', () => {
    const lagna = chartBoxes(k, 'lagna');
    expect(lagna).toHaveLength(12);
    expect(lagna[0]).toMatchObject({ house: 1, sign: 5, isAscendant: true, planets: [] });
    expect(lagna[10].planets.map((p) => p.body).sort()).toEqual(['jupiter', 'ketu', 'sun']);
    expect(lagna.flatMap((b) => b.planets)).toHaveLength(9);

    const moon = chartBoxes(k, 'moon');
    expect(moon[0].sign).toBe(0); // Moon in Aries
    expect(moon[0].planets.map((p) => p.body).sort()).toEqual(['mars', 'moon']);

    const d9 = chartBoxes(k, 'navamsa');
    expect(d9[0].sign).toBe(k.ascendant.navamsaSign);
    expect(d9.flatMap((b) => b.planets)).toHaveLength(9);
  });
});
