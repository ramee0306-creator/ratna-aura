// AUTO-COPIED from packages/kundli/src — edit the original, then run: npm run sync-shared
// Kundli Milan (gun milan): the traditional Ashtakoota match out of 36 points, plus Manglik (Mangal dosha).
// Everything is based on the Moon (rashi and nakshatra) of the two people, and Mars for Manglik.
// Regional traditions differ in a few table cells; these are the tables most Indian panchangs use.
import type { Kundli } from './chart.ts';
import { type Body, NAKSHATRA_SPAN, normalize, SIGN_LORD } from './zodiac.ts';

export const KOOTAS = ['varna', 'vashya', 'tara', 'yoni', 'grahaMaitri', 'gana', 'bhakoot', 'nadi'] as const;
export type Koota = (typeof KOOTAS)[number];

/** Highest points for each koota (together 36). */
export const KOOTA_MAX: Record<Koota, number> = { varna: 1, vashya: 2, tara: 3, yoni: 4, grahaMaitri: 5, gana: 6, bhakoot: 7, nadi: 8 };

/** The Moon of one person: sidereal longitude in degrees. */
export type MoonInput = { longitude: number };

// ---- 1. Varna (by rashi): Brahmin 3 > Kshatriya 2 > Vaishya 1 > Shudra 0 ----
export const VARNAS = ['shudra', 'vaishya', 'kshatriya', 'brahmin'] as const;
const VARNA_OF_SIGN = [2, 1, 0, 3, 2, 1, 0, 3, 2, 1, 0, 3]; // water signs Brahmin, fire Kshatriya, earth Vaishya, air Shudra

// ---- 2. Vashya (by rashi) ----
export const VASHYAS = ['chatushpada', 'manava', 'jalachara', 'vanachara', 'keeta'] as const;
const VASHYA_POINTS = [
  [2, 1, 1, 0.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0.5, 0, 1, 2, 0],
  [1, 1, 1, 0, 2],
];
function vashyaOf(lon: number): number {
  const sign = Math.floor(normalize(lon) / 30);
  const firstHalf = normalize(lon) % 30 < 15;
  // Sagittarius: first half human, second half four-legged. Capricorn: first half four-legged, second half water.
  if (sign === 8) return firstHalf ? 1 : 0;
  if (sign === 9) return firstHalf ? 0 : 2;
  return [0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2][sign];
}

// ---- 4. Yoni (by nakshatra): 14 animals ----
export const YONIS = [
  'horse', 'elephant', 'sheep', 'serpent', 'dog', 'cat', 'rat', 'cow', 'buffalo', 'tiger', 'deer', 'monkey', 'mongoose', 'lion',
] as const;
export const YONI_OF_NAKSHATRA = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];
export const YONI_POINTS = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
];

// ---- 5. Graha Maitri: natural friendship of the two rashi lords ----
type Lord = Exclude<Body, 'rahu' | 'ketu'>;
const FRIENDS: Record<Lord, { friends: Lord[]; enemies: Lord[] }> = {
  sun: { friends: ['moon', 'mars', 'jupiter'], enemies: ['venus', 'saturn'] },
  moon: { friends: ['sun', 'mercury'], enemies: [] },
  mars: { friends: ['sun', 'moon', 'jupiter'], enemies: ['mercury'] },
  mercury: { friends: ['sun', 'venus'], enemies: ['moon'] },
  jupiter: { friends: ['sun', 'moon', 'mars'], enemies: ['mercury', 'venus'] },
  venus: { friends: ['mercury', 'saturn'], enemies: ['sun', 'moon'] },
  saturn: { friends: ['mercury', 'venus'], enemies: ['sun', 'moon', 'mars'] },
};
/** How planet `a` regards planet `b`: 1 friend, 0 neutral, −1 enemy. */
function regard(a: Lord, b: Lord): number {
  if (a === b || FRIENDS[a].friends.includes(b)) return 1;
  return FRIENDS[a].enemies.includes(b) ? -1 : 0;
}
export function maitriPoints(a: Lord, b: Lord): number {
  const sum = regard(a, b) + regard(b, a);
  const bothWays = [regard(a, b), regard(b, a)].sort().join();
  if (sum === 2) return 5; // friends (or the same lord)
  if (sum === 1) return 4; // friend + neutral
  if (bothWays === '0,0') return 3; // both neutral
  if (bothWays === '-1,1') return 1; // friend + enemy
  if (sum === -1) return 0.5; // neutral + enemy
  return 0; // enemies
}

// ---- 6. Gana (by nakshatra) ----
export const GANAS = ['deva', 'manushya', 'rakshasa'] as const;
export const GANA_OF_NAKSHATRA = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];
/** Row = groom's gana, column = bride's gana. */
const GANA_POINTS = [
  [6, 6, 1],
  [5, 6, 0],
  [1, 0, 6],
];

// ---- 8. Nadi (by nakshatra): Adi, Madhya, Antya, repeating 0 1 2 2 1 0 ----
export const NADIS = ['adi', 'madhya', 'antya'] as const;
export const nadiOf = (nakshatra: number) => [0, 1, 2, 2, 1, 0][nakshatra % 6];

const nakshatraIndex = (lon: number) => Math.floor(normalize(lon) / NAKSHATRA_SPAN);
const signOf = (lon: number) => Math.floor(normalize(lon) / 30);
const padaOf = (lon: number) => Math.floor((normalize(lon) % NAKSHATRA_SPAN) / (NAKSHATRA_SPAN / 4)) + 1;
/** Counting from `from` to `to`, both included (1 = same). */
const countFrom = (from: number, to: number, n: number) => ((to - from + n) % n) + 1;

export type KootaResult = {
  koota: Koota;
  points: number;
  max: number;
  /** What each person has for this koota, e.g. ['brahmin', 'vaishya'] (groom, bride). Tara and Bhakoot give counts. */
  groom: string;
  bride: string;
};

export type Milan = {
  kootas: KootaResult[];
  total: number;
  /** Same Nadi (0 of 8). `cancelled` = one of the classic exceptions applies (same rashi or same nakshatra). */
  nadiDosha: { present: boolean; cancelled: boolean };
  /** 2/12, 5/9 or 6/8 rashi positions (0 of 7). `cancelled` = the rashi lords are the same or friends. */
  bhakootDosha: { present: boolean; cancelled: boolean };
};

export type Verdict = 'excellent' | 'good' | 'average' | 'low';

/** The usual reading of the total: 18 or more is considered acceptable. */
export function verdict(total: number): Verdict {
  if (total >= 28) return 'excellent';
  if (total >= 21) return 'good';
  if (total >= 18) return 'average';
  return 'low';
}

/** Ashtakoota gun milan between a groom and a bride, from their Moon longitudes. */
export function ashtakoota(groom: MoonInput, bride: MoonInput): Milan {
  const gSign = signOf(groom.longitude);
  const bSign = signOf(bride.longitude);
  const gNak = nakshatraIndex(groom.longitude);
  const bNak = nakshatraIndex(bride.longitude);
  const gLord = SIGN_LORD[gSign] as Lord;
  const bLord = SIGN_LORD[bSign] as Lord;

  const varna = VARNA_OF_SIGN[gSign] >= VARNA_OF_SIGN[bSign] ? 1 : 0;

  const gVashya = vashyaOf(groom.longitude);
  const bVashya = vashyaOf(bride.longitude);

  // Tara: count the nakshatras from one to the other and divide by 9; remainders 3, 5 and 7 are unfavourable.
  const taraFromBride = countFrom(bNak, gNak, 27) % 9;
  const taraFromGroom = countFrom(gNak, bNak, 27) % 9;
  const goodTara = (r: number) => (r === 3 || r === 5 || r === 7 ? 0 : 1.5);

  const gYoni = YONI_OF_NAKSHATRA[gNak];
  const bYoni = YONI_OF_NAKSHATRA[bNak];

  const gGana = GANA_OF_NAKSHATRA[gNak];
  const bGana = GANA_OF_NAKSHATRA[bNak];

  // Bhakoot: position of the rashis from each other. 2/12, 5/9 and 6/8 score 0.
  const fromBride = countFrom(bSign, gSign, 12);
  const fromGroom = countFrom(gSign, bSign, 12);
  const bhakootBad = [2, 12, 5, 9, 6, 8].includes(fromBride);

  const gNadi = nadiOf(gNak);
  const bNadi = nadiOf(bNak);
  const sameNadi = gNadi === bNadi;

  const kootas: KootaResult[] = [
    { koota: 'varna', points: varna, groom: VARNAS[VARNA_OF_SIGN[gSign]], bride: VARNAS[VARNA_OF_SIGN[bSign]] },
    { koota: 'vashya', points: VASHYA_POINTS[gVashya][bVashya], groom: VASHYAS[gVashya], bride: VASHYAS[bVashya] },
    { koota: 'tara', points: goodTara(taraFromBride) + goodTara(taraFromGroom), groom: String(countFrom(bNak, gNak, 27)), bride: String(countFrom(gNak, bNak, 27)) },
    { koota: 'yoni', points: YONI_POINTS[gYoni][bYoni], groom: YONIS[gYoni], bride: YONIS[bYoni] },
    { koota: 'grahaMaitri', points: maitriPoints(gLord, bLord), groom: gLord, bride: bLord },
    { koota: 'gana', points: GANA_POINTS[gGana][bGana], groom: GANAS[gGana], bride: GANAS[bGana] },
    { koota: 'bhakoot', points: bhakootBad ? 0 : 7, groom: String(fromBride), bride: String(fromGroom) },
    { koota: 'nadi', points: sameNadi ? 0 : 8, groom: NADIS[gNadi], bride: NADIS[bNadi] },
  ].map((k) => ({ ...k, koota: k.koota as Koota, max: KOOTA_MAX[k.koota as Koota] }));

  return {
    kootas,
    total: kootas.reduce((sum, k) => sum + k.points, 0),
    nadiDosha: {
      present: sameNadi,
      cancelled: sameNadi && ((gSign === bSign && gNak !== bNak) || (gNak === bNak && (gSign !== bSign || padaOf(groom.longitude) !== padaOf(bride.longitude)))),
    },
    bhakootDosha: { present: bhakootBad, cancelled: bhakootBad && maitriPoints(gLord, bLord) >= 4 },
  };
}

// ---- Manglik (Mangal dosha) ----
/** Houses (counted from the lagna or the Moon) where Mars makes a person Manglik. */
export const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

export type Manglik = {
  /** Mars house from the lagna; null when the birth time is unknown */
  fromLagna: { house: number; manglik: boolean } | null;
  fromMoon: { house: number; manglik: boolean };
  /** Manglik by either count */
  manglik: boolean;
  /** Mars in its own sign (Aries, Scorpio) or exalted (Capricorn): traditionally the effect is much softer. */
  softened: boolean;
};

export function manglik(kundli: Kundli): Manglik {
  const mars = kundli.planets.find((p) => p.body === 'mars')!;
  const moon = kundli.planets.find((p) => p.body === 'moon')!;
  const fromMoonHouse = countFrom(moon.sign, mars.sign, 12);
  const fromLagna = kundli.timeKnown ? { house: mars.house, manglik: MANGLIK_HOUSES.includes(mars.house) } : null;
  const fromMoon = { house: fromMoonHouse, manglik: MANGLIK_HOUSES.includes(fromMoonHouse) };
  const isManglik = Boolean(fromLagna?.manglik) || fromMoon.manglik;
  return { fromLagna, fromMoon, manglik: isManglik, softened: isManglik && [0, 7, 9].includes(mars.sign) };
}

export type MatchReport = {
  milan: Milan;
  verdict: Verdict;
  groom: Manglik;
  bride: Manglik;
  /** 'none' = neither is Manglik, 'both' = both are (traditionally they balance each other), 'one' = only one is */
  manglikBalance: 'none' | 'both' | 'one';
};

/** The full Kundli Milan of two kundlis. */
export function matchKundlis(groom: Kundli, bride: Kundli): MatchReport {
  const moon = (k: Kundli) => k.planets.find((p) => p.body === 'moon')!;
  const milan = ashtakoota(moon(groom), moon(bride));
  const g = manglik(groom);
  const b = manglik(bride);
  return {
    milan,
    verdict: verdict(milan.total),
    groom: g,
    bride: b,
    manglikBalance: g.manglik && b.manglik ? 'both' : g.manglik || b.manglik ? 'one' : 'none',
  };
}
