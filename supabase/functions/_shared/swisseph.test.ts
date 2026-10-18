import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { load } from '@fusionstrings/swiss-eph';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildKundli, chartBoxes, type Ephemeris, julianDay, normalize } from './kundli/index.ts';
import { swissEphemeris } from './swisseph.ts';

let eph: Ephemeris;
beforeAll(async () => {
  const wasm = createRequire(import.meta.url).resolve('@fusionstrings/swiss-eph/wasm');
  eph = swissEphemeris(await load(new Uint8Array(readFileSync(wasm))));
});

const jdOf = (iso: string) => julianDay(Date.parse(iso));
/** Tropical (Western) longitude = sidereal + ayanamsa */
const tropical = (body: 'sun' | 'moon' | 'jupiter' | 'saturn' | 'mercury', iso: string) => {
  const jd = jdOf(iso);
  return normalize(eph.positions(jd)[body].longitude + eph.ayanamsa(jd));
};
/** Smallest difference between two angles, in degrees */
const gap = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('Swiss Ephemeris against known sky events', () => {
  it('March equinox 2024 (20 Mar, 03:06 UT): the Sun is at 0° tropical', () => {
    expect(gap(tropical('sun', '2024-03-20T03:06:00Z'), 0)).toBeLessThan(0.001);
  });

  it('total solar eclipse of 8 Apr 2024 (18:18 UT): Sun and Moon together at 19°24′ Aries', () => {
    const sun = tropical('sun', '2024-04-08T18:18:00Z');
    expect(gap(sun, 19.4)).toBeLessThan(0.02);
    expect(gap(sun, tropical('moon', '2024-04-08T18:18:00Z'))).toBeLessThan(0.05);
  });

  it('great conjunction of 21 Dec 2020 (18:20 UT): Jupiter and Saturn at 0°29′ Aquarius', () => {
    const jup = tropical('jupiter', '2020-12-21T18:20:00Z');
    expect(gap(jup, 300.48)).toBeLessThan(0.02);
    expect(gap(jup, tropical('saturn', '2020-12-21T18:20:00Z'))).toBeLessThan(0.01);
  });

  it('Mercury was retrograde on 8 Apr 2024 and direct on 1 Jun 2024', () => {
    expect(eph.positions(jdOf('2024-04-08T12:00:00Z')).mercury.speed).toBeLessThan(0);
    expect(eph.positions(jdOf('2024-06-01T12:00:00Z')).mercury.speed).toBeGreaterThan(0);
  });

  it('Lahiri ayanamsa: 23°51′ in 2000, about 24°12′ in 2024', () => {
    expect(eph.ayanamsa(2451545)).toBeCloseTo(23.857, 2);
    expect(eph.ayanamsa(jdOf('2024-04-08T00:00:00Z'))).toBeCloseTo(24.196, 2);
  });

  it('Rahu moves backwards and stays in 0–360°', () => {
    const p = eph.positions(jdOf('2024-01-01T00:00:00Z'));
    expect(p.rahu.speed).toBeLessThan(0);
    for (const s of Object.values(p)) {
      expect(s.longitude).toBeGreaterThanOrEqual(0);
      expect(s.longitude).toBeLessThan(360);
    }
  });
});

/**
 * Independent check of the ascendant using the textbook formula (Meeus, Astronomical Algorithms):
 * sidereal time -> local sidereal time -> ascendant = atan2(cos θ, −(sin θ cos ε + tan φ sin ε)).
 */
function textbookAscendant(jd: number, lat: number, lon: number, ayanamsa: number) {
  const T = (jd - 2451545) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - (T * T * T) / 38710000;
  const theta = ((gmst + lon) * Math.PI) / 180;
  const eps = ((23.4392911 - 0.0130042 * T) * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const asc = (Math.atan2(Math.cos(theta), -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * 180) / Math.PI;
  return normalize(asc - ayanamsa);
}

describe('ascendant (lagna)', () => {
  it.each([
    ['Mumbai, 14 Aug 1990 05:00 UT', '1990-08-14T05:00:00Z', 19.076, 72.8777],
    ['Delhi, 1 Jan 2000 00:00 UT', '2000-01-01T00:00:00Z', 28.6139, 77.209],
    ['Chennai, 30 Jun 2015 13:45 UT', '2015-06-30T13:45:00Z', 13.0827, 80.2707],
    ['London, 15 Mar 1975 22:10 UT', '1975-03-15T22:10:00Z', 51.5072, -0.1276],
  ])('%s matches the textbook formula', (_name, iso, lat, lon) => {
    const jd = jdOf(iso);
    expect(gap(eph.ascendant(jd, lat, lon), textbookAscendant(jd, lat, lon, eph.ayanamsa(jd)))).toBeLessThan(0.05);
  });
});

describe('a full kundli with the real engine', () => {
  it('Mumbai, 14 Aug 1990, 10:30 IST', () => {
    const k = buildKundli(
      { birthDate: '1990-08-14', birthTime: '10:30', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
      eph,
      Date.parse('2026-10-18T00:00:00Z'),
    );
    const sign = (b: string) => k.planets.find((p) => p.body === b)!.sign;
    expect(k.ascendant.sign).toBe(5); // Virgo lagna
    expect(sign('sun')).toBe(3); // Sun in sidereal Cancer (tropical Leo)
    expect(sign('saturn')).toBe(8); // Saturn in Sagittarius
    expect(k.planets.find((p) => p.body === 'saturn')!.retrograde).toBe(true);
    expect(sign('jupiter')).toBe(3); // Jupiter in Cancer, exalted
    expect(k.planets.find((p) => p.body === 'jupiter')!.dignity).toBe('exalted');
    expect(chartBoxes(k, 'lagna').flatMap((b) => b.planets)).toHaveLength(9);
    expect(k.engine).toMatch(/Swiss Ephemeris 2\.10/);
  });
});
