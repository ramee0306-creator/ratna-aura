// The twelve signs (rashis), 27 nakshatras and the planets used in Vedic astrology.

export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
export type Sign = (typeof SIGNS)[number];

export const BODIES = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'] as const;
export type Body = (typeof BODIES)[number];

export const NAKSHATRAS = [
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha',
  'magha', 'purvaPhalguni', 'uttaraPhalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha', 'jyeshtha',
  'mula', 'purvaAshadha', 'uttaraAshadha', 'shravana', 'dhanishta', 'shatabhisha', 'purvaBhadrapada', 'uttaraBhadrapada', 'revati',
] as const;
export type Nakshatra = (typeof NAKSHATRAS)[number];

/** Each nakshatra spans 13°20′. */
export const NAKSHATRA_SPAN = 360 / 27;

/** Keeps an angle in 0 ≤ x < 360. */
export const normalize = (deg: number) => ((deg % 360) + 360) % 360;

/** 0 = Aries … 11 = Pisces */
export const signIndex = (lon: number) => Math.floor(normalize(lon) / 30);

export const degreeInSign = (lon: number) => normalize(lon) % 30;

/** 0 = Ashwini … 26 = Revati, and the quarter (pada) 1–4. */
export function nakshatraOf(lon: number): { index: number; pada: number } {
  const x = normalize(lon);
  const index = Math.floor(x / NAKSHATRA_SPAN);
  const pada = Math.floor((x % NAKSHATRA_SPAN) / (NAKSHATRA_SPAN / 4)) + 1;
  return { index, pada };
}

/** Navamsa (D9) sign: each sign is split into nine parts of 3°20′, counted on through the zodiac. */
export const navamsaSign = (lon: number) => Math.floor(normalize(lon) / (30 / 9)) % 12;

/** The planet that rules each sign (index 0 = Aries). */
export const SIGN_LORD: readonly Body[] = [
  'mars', 'venus', 'mercury', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'saturn', 'jupiter',
];

const EXALTATION: Partial<Record<Body, number>> = { sun: 0, moon: 1, mars: 9, mercury: 5, jupiter: 3, venus: 11, saturn: 6, rahu: 1, ketu: 7 };

export type Dignity = 'exalted' | 'debilitated' | 'own' | null;

/** Exalted (uchcha), debilitated (neecha) or in its own sign (swakshetra). */
export function dignity(body: Body, sign: number): Dignity {
  const ex = EXALTATION[body];
  if (ex === sign) return 'exalted';
  if (ex !== undefined && (ex + 6) % 12 === sign) return 'debilitated';
  if (body !== 'rahu' && body !== 'ketu' && SIGN_LORD[sign] === body) return 'own';
  return null;
}

/** "25°23′" */
export function formatDegrees(deg: number): string {
  let d = Math.floor(deg);
  let m = Math.round((deg - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}°${String(m).padStart(2, '0')}′`;
}
