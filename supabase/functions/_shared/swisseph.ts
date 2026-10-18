// ─────────────────────────────────────────────────────────────────────────────
// Swiss Ephemeris adapter (the swappable astronomy engine).
//
// LICENCE: the Swiss Ephemeris is dual-licensed — AGPL-3.0 or a paid professional
// licence from Astrodienst (astro.com/swisseph). This file and the WebAssembly build it
// loads are the only AGPL parts of Ratna Aura, kept separate on purpose.
// BEFORE PUBLIC LAUNCH: buy the professional licence, or replace this file with another
// object implementing `Ephemeris` (e.g. a paid astrology API). See README → Licences.
// ─────────────────────────────────────────────────────────────────────────────
import type { Ephemeris, GrahaPositions } from './kundli/ephemeris.ts';

/** The parts of the Swiss Ephemeris WebAssembly API that we use. */
export type SwissEphLike = {
  swe_version(): string;
  swe_set_sid_mode(mode: number, t0: number, ayanT0: number): void;
  swe_calc_ut(jdUt: number, body: number, flags: number): { returnCode: number; xx: ArrayLike<number>; error: string };
  swe_houses_ex(jdUt: number, flags: number, lat: number, lon: number, hsys: number): { returnCode: number; ascmc: ArrayLike<number> };
  swe_get_ayanamsa_ut(jdUt: number): number;
};

// Constants from swephexp.h
const SE_SUN = 0, SE_MOON = 1, SE_MERCURY = 2, SE_VENUS = 3, SE_MARS = 4, SE_JUPITER = 5, SE_SATURN = 6;
const SE_MEAN_NODE = 10, SE_TRUE_NODE = 11;
const SEFLG_MOSEPH = 4; // built-in Moshier ephemeris: no data files needed, accurate to about 1″ for planets
const SEFLG_SPEED = 256;
const SEFLG_SIDEREAL = 64 * 1024;
const SE_SIDM_LAHIRI = 1;

const BODIES = {
  sun: SE_SUN,
  moon: SE_MOON,
  mars: SE_MARS,
  mercury: SE_MERCURY,
  jupiter: SE_JUPITER,
  venus: SE_VENUS,
  saturn: SE_SATURN,
} as const;

export type SwissOptions = {
  /** Mean lunar node (traditional in most Indian almanacs) or true node */
  node?: 'mean' | 'true';
};

export function swissEphemeris(swe: SwissEphLike, { node = 'mean' }: SwissOptions = {}): Ephemeris {
  swe.swe_set_sid_mode(SE_SIDM_LAHIRI, 0, 0);
  const flags = SEFLG_MOSEPH | SEFLG_SPEED | SEFLG_SIDEREAL;

  const calc = (jd: number, body: number) => {
    const r = swe.swe_calc_ut(jd, body, flags);
    if (r.returnCode < 0) throw new Error(`Swiss Ephemeris error: ${r.error}`);
    return { longitude: r.xx[0], speed: r.xx[3] };
  };

  return {
    name: `Swiss Ephemeris ${swe.swe_version()} (Moshier), Lahiri ayanamsa, ${node} node`,
    positions(jd) {
      const out = {} as GrahaPositions;
      for (const [name, id] of Object.entries(BODIES)) out[name as keyof typeof BODIES] = calc(jd, id);
      out.rahu = calc(jd, node === 'mean' ? SE_MEAN_NODE : SE_TRUE_NODE);
      return out;
    },
    ascendant(jd, latitude, longitude) {
      const r = swe.swe_houses_ex(jd, SEFLG_MOSEPH | SEFLG_SIDEREAL, latitude, longitude, 'W'.charCodeAt(0));
      if (r.returnCode < 0) throw new Error('Swiss Ephemeris could not compute the ascendant');
      return r.ascmc[0];
    },
    ayanamsa(jd) {
      return swe.swe_get_ayanamsa_ut(jd);
    },
  };
}
