// Panchang checked against published values (Drik Panchang, New Delhi / Mumbai), within 2 minutes.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { load } from '@fusionstrings/swiss-eph';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildPanchang, karanaName, MONTHS, NAKSHATRAS, type Panchang, tithiName, VARAS, YOGAS } from './kundli/index.ts';
import { swissEphemeris } from './swisseph.ts';

let eph: ReturnType<typeof swissEphemeris>;
beforeAll(async () => {
  const wasm = createRequire(import.meta.url).resolve('@fusionstrings/swiss-eph/wasm');
  eph = swissEphemeris(await load(new Uint8Array(readFileSync(wasm))));
});

const DELHI = { latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' };
const MUMBAI = { latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' };
/** "2024-04-24 05:18" India time -> ms */
const ist = (s: string) => Date.parse(`${s.replace(' ', 'T')}:00+05:30`);
const near = (ms: number | null, s: string, minutes = 2) => {
  expect(ms).not.toBeNull();
  expect(Math.abs(ms! - ist(s)) / 60_000).toBeLessThan(minutes);
};

describe('Panchang', () => {
  let p: Panchang;

  it('Chaitra Purnima, Tuesday 23 April 2024, New Delhi', () => {
    p = buildPanchang({ date: '2024-04-23', ...DELHI }, eph);
    expect(VARAS[p.vara]).toBe('tuesday');
    near(p.sunrise, '2024-04-23 05:48');
    near(p.sunset, '2024-04-23 18:52');
    near(p.moonrise, '2024-04-23 18:25', 3);
    expect(tithiName(p.tithi[0].index)).toBe('purnima');
    near(p.tithi[0].start, '2024-04-23 03:25');
    near(p.tithi[0].end, '2024-04-24 05:18');
    expect(p.paksha).toBe('shukla');
    expect(p.nakshatra.map((n) => NAKSHATRAS[n.index])).toEqual(['chitra', 'swati']);
    near(p.nakshatra[0].end, '2024-04-23 22:32');
    expect(YOGAS[p.yoga[0].index]).toBe('vajra');
    near(p.yoga[0].end, '2024-04-24 04:57');
    expect(p.karana.map((k) => karanaName(k.index))).toEqual(['vishti', 'bava', 'balava']);
    expect(MONTHS[p.month.amanta]).toBe('chaitra');
    expect(MONTHS[p.month.purnimanta]).toBe('chaitra');
    expect(p.month.adhika).toBe(false);
    expect(p.samvat).toEqual({ vikram: 2081, shaka: 1946 });
  });

  it('Tuesday Rahu Kaal is the 7th eighth of the daytime (about 15:35–17:13)', () => {
    near(p.rahuKaal.start, '2024-04-23 15:35');
    near(p.rahuKaal.end, '2024-04-23 17:13');
    near(p.yamaganda.start, '2024-04-23 09:04');
    near(p.gulika.start, '2024-04-23 12:20');
    near(p.abhijit.start, '2024-04-23 11:53');
    near(p.abhijit.end, '2024-04-23 12:45');
  });

  it('the spans run without gaps from sunrise to the next sunrise', () => {
    for (const list of [p.tithi, p.nakshatra, p.yoga, p.karana, p.moonSign]) {
      expect(list[0].start).toBeLessThanOrEqual(p.sunrise);
      expect(list.at(-1)!.end).toBeGreaterThanOrEqual(p.nextSunrise);
      for (let i = 1; i < list.length; i++) expect(list[i].start).toBe(list[i - 1].end);
    }
  });

  it('Janmashtami, 26 August 2024: Ashtami until 02:19 and Rohini from 15:55', () => {
    const j = buildPanchang({ date: '2024-08-26', ...DELHI }, eph);
    expect(VARAS[j.vara]).toBe('monday');
    expect(tithiName(j.tithi[0].index)).toBe('ashtami');
    expect(j.paksha).toBe('krishna');
    near(j.tithi[0].start, '2024-08-26 03:39');
    near(j.tithi[0].end, '2024-08-27 02:19');
    expect(NAKSHATRAS[j.nakshatra[1].index]).toBe('rohini');
    near(j.nakshatra[1].start, '2024-08-26 15:55');
    // Amanta Shravana Krishna = Purnimanta Bhadrapada Krishna
    expect([MONTHS[j.month.amanta], MONTHS[j.month.purnimanta]]).toEqual(['shravana', 'bhadrapada']);
    near(j.rahuKaal.start, '2024-08-26 07:32'); // Monday: 2nd eighth
  });

  it('Adhik Shravana Amavasya, 16 August 2023, Mumbai', () => {
    const a = buildPanchang({ date: '2023-08-16', ...MUMBAI }, eph);
    expect(tithiName(a.tithi[0].index)).toBe('amavasya');
    near(a.tithi[0].end, '2023-08-16 15:07');
    expect(a.month).toEqual({ amanta: MONTHS.indexOf('shravana'), purnimanta: MONTHS.indexOf('shravana'), adhika: true });
    expect(karanaName(a.karana[1].index)).toBe('kimstughna');
    expect(a.samvat.vikram).toBe(2080);
  });
});

describe('Panchang names', () => {
  it('tithis and karanas', () => {
    expect(tithiName(0)).toBe('pratipada');
    expect(tithiName(14)).toBe('purnima');
    expect(tithiName(15)).toBe('pratipada');
    expect(tithiName(29)).toBe('amavasya');
    expect(karanaName(0)).toBe('kimstughna');
    expect(karanaName(1)).toBe('bava');
    expect(karanaName(7)).toBe('vishti');
    expect(karanaName(8)).toBe('bava');
    expect(karanaName(56)).toBe('vishti');
    expect([57, 58, 59].map(karanaName)).toEqual(['shakuni', 'chatushpada', 'naga']);
  });
});
