// Panchang: the five limbs of the Hindu day (vara, tithi, nakshatra, yoga, karana) for a date and place,
// with sunrise/sunset and the daily auspicious and inauspicious periods.
// As in printed panchangs, the day runs from one sunrise to the next.
import type { Ephemeris, RiseSetEphemeris } from './ephemeris.ts';
import { fromJulianDay, julianDay, zonedTimeToUtc } from './time.ts';
import { NAKSHATRA_SPAN, normalize } from './zodiac.ts';

export const TITHIS = [
  'pratipada', 'dwitiya', 'tritiya', 'chaturthi', 'panchami', 'shashthi', 'saptami', 'ashtami',
  'navami', 'dashami', 'ekadashi', 'dwadashi', 'trayodashi', 'chaturdashi', 'purnima',
] as const;
export type TithiName = (typeof TITHIS)[number] | 'amavasya';

/** 0–14 Shukla paksha (14 = Purnima), 15–29 Krishna paksha (29 = Amavasya). */
export const tithiName = (index: number): TithiName => (index === 29 ? 'amavasya' : TITHIS[index % 15]);
export const pakshaOf = (tithi: number): 'shukla' | 'krishna' => (tithi < 15 ? 'shukla' : 'krishna');

export const YOGAS = [
  'vishkambha', 'priti', 'ayushman', 'saubhagya', 'shobhana', 'atiganda', 'sukarma', 'dhriti', 'shula',
  'ganda', 'vriddhi', 'dhruva', 'vyaghata', 'harshana', 'vajra', 'siddhi', 'vyatipata', 'variyana',
  'parigha', 'shiva', 'siddha', 'sadhya', 'shubha', 'shukla', 'brahma', 'indra', 'vaidhriti',
] as const;

export const KARANAS = ['bava', 'balava', 'kaulava', 'taitila', 'gara', 'vanija', 'vishti', 'shakuni', 'chatushpada', 'naga', 'kimstughna'] as const;
export type Karana = (typeof KARANAS)[number];

/** Each tithi has two karanas (60 in a lunar month): 7 repeating ones, plus 4 fixed ones at new moon. */
export function karanaName(index: number): Karana {
  if (index === 0) return 'kimstughna';
  if (index >= 57) return (['shakuni', 'chatushpada', 'naga'] as const)[index - 57];
  return KARANAS[(index - 1) % 7];
}

/** Lunar months, Chaitra first. */
export const MONTHS = [
  'chaitra', 'vaishakha', 'jyeshtha', 'ashadha', 'shravana', 'bhadrapada',
  'ashwin', 'kartika', 'margashirsha', 'pausha', 'magha', 'phalguna',
] as const;

/** 0 = Sunday … 6 = Saturday */
export const VARAS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

// Which eighth of the daytime each period falls in, by weekday (Sunday first).
const RAHU_PART = [8, 2, 7, 5, 6, 4, 3];
const YAMAGANDA_PART = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_PART = [7, 6, 5, 4, 3, 2, 1];

export type PanchangInput = {
  /** YYYY-MM-DD at the place */
  date: string;
  latitude: number;
  longitude: number;
  /** IANA time zone, e.g. "Asia/Kolkata" */
  timezone: string;
};

/** Times are milliseconds since 1970 (UTC); show them in the place's time zone. */
export type TimeRange = { start: number; end: number };
/** One tithi / nakshatra / yoga / karana and when it begins and ends. */
export type Span = TimeRange & { index: number };

export type Panchang = {
  input: PanchangInput;
  vara: number;
  sunrise: number;
  sunset: number;
  /** Sunrise of the next day — the end of this panchang day */
  nextSunrise: number;
  moonrise: number | null;
  moonset: number | null;
  /** Everything from sunrise to the next sunrise. The first item is the one running at sunrise. */
  tithi: Span[];
  nakshatra: Span[];
  yoga: Span[];
  karana: Span[];
  moonSign: Span[];
  /** Sidereal sign of the Sun at sunrise (0 = Mesha) */
  sunSign: number;
  paksha: 'shukla' | 'krishna';
  month: {
    /** Month that ends with the new moon (used in South and West India), index into MONTHS */
    amanta: number;
    /** Month that ends with the full moon (used in North India) */
    purnimanta: number;
    /** An extra (adhika) month: no sankranti between its two new moons. Both calendars then use the same name. */
    adhika: boolean;
  };
  samvat: { vikram: number; shaka: number };
  rahuKaal: TimeRange;
  yamaganda: TimeRange;
  gulika: TimeRange;
  /** 8th of the 15 daytime muhurtas; traditionally not used on Wednesdays */
  abhijit: TimeRange;
  /** 96 to 48 minutes before sunrise */
  brahmaMuhurta: TimeRange;
  engine: string;
};

type Sky = Ephemeris & RiseSetEphemeris;

const DAY = 86_400_000;

export function buildPanchang(input: PanchangInput, eph: Sky): Panchang {
  const [year, month, day] = input.date.split('-').map(Number);
  const midnight = zonedTimeToUtc({ year, month, day, hour: 0, minute: 0 }, input.timezone);
  const nextMidnight = zonedTimeToUtc({ year, month, day: day + 1, hour: 0, minute: 0 }, input.timezone);
  const { latitude: lat, longitude: lon } = input;

  const next = (fromMs: number, body: 'sun' | 'moon', event: 'rise' | 'set') => {
    const jd = eph.riseSet(julianDay(fromMs), body, lat, lon, event);
    return jd === null ? null : fromJulianDay(jd);
  };
  const sunrise = next(midnight, 'sun', 'rise');
  const sunset = sunrise === null ? null : next(sunrise, 'sun', 'set');
  const nextSunrise = sunset === null ? null : next(sunset, 'sun', 'rise');
  if (sunrise === null || sunset === null || nextSunrise === null) throw new Error('The Sun does not rise or set here on this date');
  const moonrise = next(midnight, 'moon', 'rise');
  const moonset = next(midnight, 'moon', 'set');

  // Angles that define each limb, and how fast they grow (degrees per day).
  const sky = (ms: number) => {
    const p = eph.positions(julianDay(ms));
    return { sun: p.sun, moon: p.moon };
  };
  type Limb = { value: (s: ReturnType<typeof sky>) => number; rate: (s: ReturnType<typeof sky>) => number; span: number; count: number };
  const LIMBS = {
    tithi: { value: (s) => normalize(s.moon.longitude - s.sun.longitude), rate: (s) => s.moon.speed - s.sun.speed, span: 12, count: 30 },
    karana: { value: (s) => normalize(s.moon.longitude - s.sun.longitude), rate: (s) => s.moon.speed - s.sun.speed, span: 6, count: 60 },
    nakshatra: { value: (s) => s.moon.longitude, rate: (s) => s.moon.speed, span: NAKSHATRA_SPAN, count: 27 },
    yoga: { value: (s) => normalize(s.moon.longitude + s.sun.longitude), rate: (s) => s.moon.speed + s.sun.speed, span: NAKSHATRA_SPAN, count: 27 },
    moonSign: { value: (s) => s.moon.longitude, rate: (s) => s.moon.speed, span: 30, count: 12 },
  } satisfies Record<string, Limb>;

  /** The moment near `fromMs` when the limb's angle reaches `target` (Newton's method). */
  const reach = (limb: Limb, target: number, fromMs: number) => {
    let ms = fromMs;
    for (let i = 0; i < 30; i++) {
      const s = sky(ms);
      let diff = normalize(target - limb.value(s));
      if (diff > 180) diff -= 360;
      if (Math.abs(diff) < 1e-6) break;
      ms += (diff / limb.rate(s)) * DAY;
    }
    return ms;
  };

  const spans = (limb: Limb): Span[] => {
    const index = Math.floor(limb.value(sky(sunrise)) / limb.span) % limb.count;
    const out: Span[] = [{ index, start: reach(limb, index * limb.span, sunrise), end: reach(limb, (index + 1) * limb.span, sunrise) }];
    while (out.at(-1)!.end < nextSunrise) {
      const last = out.at(-1)!;
      const i = (last.index + 1) % limb.count;
      out.push({ index: i, start: last.end, end: reach(limb, ((i + 1) % limb.count) * limb.span, last.end) });
    }
    return out;
  };

  const tithi = spans(LIMBS.tithi);
  const vara = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  // Lunar month: named after the Sun's sign at the new moon that starts it.
  const newMoonBefore = reach(LIMBS.tithi, 0, sunrise - (tithi[0].index * 12 * DAY) / 12.2);
  const newMoonAfter = reach(LIMBS.tithi, 0, newMoonBefore + 29.5 * DAY);
  const sunSignAt = (ms: number) => Math.floor(sky(ms).sun.longitude / 30);
  const amanta = (sunSignAt(newMoonBefore) + 1) % 12;
  const adhika = sunSignAt(newMoonBefore) === sunSignAt(newMoonAfter);
  const paksha = pakshaOf(tithi[0].index);
  // Purnimanta months start a fortnight earlier, so Krishna paksha belongs to the next month — except in an
  // adhika month, which both calendars keep from new moon to new moon.
  const purnimanta = paksha === 'krishna' && !adhika ? (amanta + 1) % 12 : amanta;
  // Vikram Samvat starts at Chaitra Shukla Pratipada (March/April).
  const vikram = amanta >= 9 && month <= 4 ? year + 56 : year + 57;

  const dayLength = sunset - sunrise;
  const eighth = (part: number): TimeRange => ({ start: sunrise + ((part - 1) * dayLength) / 8, end: sunrise + (part * dayLength) / 8 });

  return {
    input,
    vara,
    sunrise,
    sunset,
    nextSunrise,
    moonrise: moonrise !== null && moonrise < nextMidnight ? moonrise : null,
    moonset: moonset !== null && moonset < nextMidnight ? moonset : null,
    tithi,
    nakshatra: spans(LIMBS.nakshatra),
    yoga: spans(LIMBS.yoga),
    karana: spans(LIMBS.karana),
    moonSign: spans(LIMBS.moonSign),
    sunSign: sunSignAt(sunrise),
    paksha,
    month: { amanta, purnimanta, adhika },
    samvat: { vikram, shaka: vikram - 135 },
    rahuKaal: eighth(RAHU_PART[vara]),
    yamaganda: eighth(YAMAGANDA_PART[vara]),
    gulika: eighth(GULIKA_PART[vara]),
    abhijit: { start: sunrise + (7 * dayLength) / 15, end: sunrise + (8 * dayLength) / 15 },
    brahmaMuhurta: { start: sunrise - 96 * 60_000, end: sunrise - 48 * 60_000 },
    engine: eph.name,
  };
}
