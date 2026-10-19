// Daily rashifal (horoscope for each Moon sign), written by AI once per sign, day and language.
// This file holds the parts that need no network: the sky notes given to the AI, the instructions
// (with the safety rules) and the shape of the answer. The server function is supabase/functions/rashifal.
import { BODIES, type Ephemeris, julianDay, NAKSHATRAS, normalize, type Panchang, SIGNS, tithiName, VARAS, YOGAS } from './kundli/index.ts';

/** Sanskrit name (English name), as given to the AI. */
export const SIGN_LABELS = [
  'Mesha (Aries)', 'Vrishabha (Taurus)', 'Mithuna (Gemini)', 'Karka (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)',
  'Tula (Libra)', 'Vrishchika (Scorpio)', 'Dhanu (Sagittarius)', 'Makara (Capricorn)', 'Kumbha (Aquarius)', 'Meena (Pisces)',
];
const BODY_LABELS: Record<string, string> = {
  sun: 'Sun (Surya)', moon: 'Moon (Chandra)', mars: 'Mars (Mangal)', mercury: 'Mercury (Budh)', jupiter: 'Jupiter (Guru)',
  venus: 'Venus (Shukra)', saturn: 'Saturn (Shani)', rahu: 'Rahu', ketu: 'Ketu',
};
const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`;
const words = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

/** Facts about the day's sky for one Moon sign, in plain English, for the AI to build on. */
export function skyNotes(sign: number, eph: Ephemeris, panchang: Panchang): string {
  const positions = eph.positions(julianDay(panchang.sunrise));
  const lines = [
    `Day: ${words(VARAS[panchang.vara])}. Tithi at sunrise: ${words(panchang.paksha)} ${words(tithiName(panchang.tithi[0].index))}.`,
    `Nakshatra of the day: ${words(NAKSHATRAS[panchang.nakshatra[0].index])}. Yoga: ${words(YOGAS[panchang.yoga[0].index])}.`,
  ];
  const moonSigns = panchang.moonSign.filter((s) => s.end > panchang.sunrise && s.start < panchang.nextSunrise);
  if (moonSigns.length > 1) lines.push(`The Moon moves from ${SIGN_LABELS[moonSigns[0].index]} into ${SIGN_LABELS[moonSigns[1].index]} during the day.`);
  lines.push(`Planets counted from ${SIGN_LABELS[sign]} (the sign itself is the 1st house):`);
  for (const body of BODIES) {
    const state = body === 'ketu' ? { longitude: normalize(positions.rahu.longitude + 180), speed: 0 } : positions[body];
    const s = Math.floor(state.longitude / 30);
    const house = ((s - sign + 12) % 12) + 1;
    const retro = body !== 'rahu' && body !== 'ketu' && state.speed < 0 ? ', retrograde' : '';
    lines.push(`- ${BODY_LABELS[body]} in ${SIGN_LABELS[s]}: ${ordinal(house)} house${retro}`);
  }
  return lines.join('\n');
}

export const RASHIFAL_SYSTEM = `You write the daily rashifal (Vedic Moon-sign horoscope) for Ratna Aura, an Indian astrology app.

How to write:
- Warm, calm, encouraging and practical, like a kind elder. Simple everyday words; no heavy jargon.
- Base it on the sky notes you are given (transits counted from the Moon sign, tithi, nakshatra), interpreted
  in the usual Vedic way, but mention at most one or two planets by name.
- Write ONLY in the language you are asked for, in its normal script, using that language's usual astrology words.
- Speak to the reader as "you" (polite form). Make each sign's reading specific; avoid filler.

Safety rules (always):
- This is guidance and reflection, never certainty. Do not promise outcomes.
- Never frighten: no predictions of death, accidents, serious illness, divorce, job loss or disasters. Present
  challenges as gentle cautions with something positive the reader can do.
- No medical, legal or financial advice. Health: only general wellbeing (rest, water, a walk, calm breathing).
  Money: only general habits (patience, careful planning); no investments, trading, lottery or gambling.
- No black magic, vashikaran, curses or spells. Do not tell people to buy gemstones, yantras or paid pujas.
- Respect all religions, genders and relationships. No caste remarks.`;

export function rashifalPrompt(opts: { sign: number; date: string; language: string; sky: string }): string {
  return `Write the rashifal for ${SIGN_LABELS[opts.sign]} for ${opts.date}, in ${opts.language}.

Sky notes for the day:
${opts.sky}

Fill every field. Lengths: headline up to 10 words; overview 2–3 sentences; love, career, money and health
1–2 sentences each; tip one short practical sentence. luckyColour is one common colour word, luckyNumber 1–9.`;
}

/** JSON Schema for the answer (structured outputs). */
export const RASHIFAL_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    overview: { type: 'string' },
    love: { type: 'string' },
    career: { type: 'string' },
    money: { type: 'string' },
    health: { type: 'string' },
    tip: { type: 'string' },
    luckyColour: { type: 'string' },
    luckyNumber: { type: 'integer' },
  },
  required: ['headline', 'overview', 'love', 'career', 'money', 'health', 'tip', 'luckyColour', 'luckyNumber'],
  additionalProperties: false,
} as const;

export type Rashifal = {
  headline: string;
  overview: string;
  love: string;
  career: string;
  money: string;
  health: string;
  tip: string;
  luckyColour: string;
  luckyNumber: number;
};

const TEXT_FIELDS = ['headline', 'overview', 'love', 'career', 'money', 'health', 'tip', 'luckyColour'] as const;

/** Checks the AI answer and trims it. Returns null if it is not usable. */
export function cleanRashifal(value: unknown): Rashifal | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of TEXT_FIELDS) {
    if (typeof v[key] !== 'string' || !v[key].trim()) return null;
    out[key] = v[key].trim().slice(0, 1200);
  }
  const n = Number(v.luckyNumber);
  out.luckyNumber = Number.isInteger(n) && n >= 1 && n <= 9 ? n : 1 + (Math.abs(Math.trunc(n) || 0) % 9);
  return out as Rashifal;
}

export const SIGN_COUNT = SIGNS.length;
