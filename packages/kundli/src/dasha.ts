// Vimshottari dasha: a 120-year cycle of planetary periods, starting from the
// nakshatra the Moon was in at birth.
import { type Body, NAKSHATRA_SPAN, nakshatraOf, normalize } from './zodiac.ts';

export const DASHA_ORDER: readonly Body[] = ['ketu', 'venus', 'sun', 'moon', 'mars', 'rahu', 'jupiter', 'saturn', 'mercury'];
export const DASHA_YEARS: Readonly<Record<Body, number>> = {
  ketu: 7,
  venus: 20,
  sun: 6,
  moon: 10,
  mars: 7,
  rahu: 18,
  jupiter: 16,
  saturn: 19,
  mercury: 17,
};

/** Dasha years are counted as 365.25 days. */
export const YEAR_MS = 365.25 * 86_400_000;

export type Period = { lord: Body; start: number; end: number };
export type Mahadasha = Period & { antardashas: Period[] };

export const nakshatraLord = (nakshatra: number): Body => DASHA_ORDER[nakshatra % 9];

/** Fraction (0–1) of the Moon's nakshatra already passed at birth. */
export function nakshatraElapsed(moonLongitude: number): number {
  return (normalize(moonLongitude) % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
}

function subPeriods(parent: Period, years: number): Period[] {
  const out: Period[] = [];
  const first = DASHA_ORDER.indexOf(parent.lord);
  let start = parent.start;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(first + i) % 9];
    const length = (years * DASHA_YEARS[lord] * YEAR_MS) / 120;
    out.push({ lord, start, end: start + length });
    start += length;
  }
  return out;
}

/**
 * The nine mahadashas (with their antardashas) from birth onwards.
 * The first mahadasha has only its remaining "balance" left at birth;
 * antardashas that finished before birth are dropped.
 */
export function vimshottari(moonLongitude: number, birthUtcMs: number): Mahadasha[] {
  const startLord = nakshatraLord(nakshatraOf(moonLongitude).index);
  const elapsedYears = nakshatraElapsed(moonLongitude) * DASHA_YEARS[startLord];
  let start = birthUtcMs - elapsedYears * YEAR_MS;
  const first = DASHA_ORDER.indexOf(startLord);
  const result: Mahadasha[] = [];
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(first + i) % 9];
    const end = start + DASHA_YEARS[lord] * YEAR_MS;
    const full: Period = { lord, start, end };
    const antardashas = subPeriods(full, DASHA_YEARS[lord])
      .filter((p) => p.end > birthUtcMs)
      .map((p) => ({ ...p, start: Math.max(p.start, birthUtcMs) }));
    result.push({ lord, start: Math.max(start, birthUtcMs), end, antardashas });
    start = end;
  }
  return result;
}

/** The mahadasha and antardasha running at a moment (or null if outside the 120 years). */
export function currentDasha(dashas: Mahadasha[], atMs: number): { mahadasha: Body; antardasha: Body } | null {
  const md = dashas.find((d) => d.start <= atMs && atMs < d.end);
  const ad = md?.antardashas.find((d) => d.start <= atMs && atMs < d.end);
  return md && ad ? { mahadasha: md.lord, antardasha: ad.lord } : null;
}
