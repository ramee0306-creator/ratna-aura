// AUTO-COPIED from packages/kundli/src — edit the original, then run: npm run sync-shared
// Putting it together: a full kundli from birth details and an ephemeris.
import { currentDasha, type Mahadasha, vimshottari } from './dasha.ts';
import type { Ephemeris } from './ephemeris.ts';
import { julianDay, zonedTimeToUtc } from './time.ts';
import { type Body, BODIES, degreeInSign, type Dignity, dignity, nakshatraOf, navamsaSign, normalize, signIndex } from './zodiac.ts';

export type BirthInput = {
  /** YYYY-MM-DD, local date at the birth place */
  birthDate: string;
  /** HH:MM (24-hour) local time, or null if unknown — then 12:00 noon is used and the lagna is unreliable */
  birthTime: string | null;
  latitude: number;
  longitude: number;
  /** IANA time zone of the birth place, e.g. "Asia/Kolkata" */
  timezone: string;
};

export type Point = {
  longitude: number;
  /** 0 = Aries … 11 = Pisces */
  sign: number;
  degreeInSign: number;
  /** 0 = Ashwini … 26 = Revati */
  nakshatra: number;
  pada: number;
  /** Sign in the navamsa (D9) chart */
  navamsaSign: number;
};

export type PlanetPosition = Point & {
  body: Body;
  /** Whole-sign house from the lagna, 1–12 */
  house: number;
  retrograde: boolean;
  dignity: Dignity;
};

export type Kundli = {
  input: BirthInput;
  timeKnown: boolean;
  /** UTC moment of birth (ISO) */
  utc: string;
  julianDay: number;
  ayanamsa: number;
  ascendant: Point;
  planets: PlanetPosition[];
  dashas: Mahadasha[];
  /** The dasha running when the kundli was made */
  current: { mahadasha: Body; antardasha: Body } | null;
  engine: string;
};

function point(lon: number): Point {
  const longitude = normalize(lon);
  const { index, pada } = nakshatraOf(longitude);
  return { longitude, sign: signIndex(longitude), degreeInSign: degreeInSign(longitude), nakshatra: index, pada, navamsaSign: navamsaSign(longitude) };
}

export function birthMoment(input: BirthInput): number {
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = (input.birthTime ?? '12:00').split(':').map(Number);
  return zonedTimeToUtc({ year, month, day, hour, minute }, input.timezone);
}

export function buildKundli(input: BirthInput, ephemeris: Ephemeris, now: number = Date.now()): Kundli {
  const utcMs = birthMoment(input);
  const jd = julianDay(utcMs);
  const graha = ephemeris.positions(jd);
  const ascendant = point(ephemeris.ascendant(jd, input.latitude, input.longitude));

  const states: Record<Body, { longitude: number; speed: number }> = {
    ...graha,
    // Ketu is always exactly opposite Rahu.
    ketu: { longitude: normalize(graha.rahu.longitude + 180), speed: graha.rahu.speed },
  };

  const planets = BODIES.map((body): PlanetPosition => {
    const p = point(states[body].longitude);
    return {
      ...p,
      body,
      house: ((p.sign - ascendant.sign + 12) % 12) + 1,
      // Rahu and Ketu always move backwards, so they are not marked retrograde.
      retrograde: body !== 'rahu' && body !== 'ketu' && states[body].speed < 0,
      dignity: dignity(body, p.sign),
    };
  });

  const dashas = vimshottari(states.moon.longitude, utcMs);
  return {
    input,
    timeKnown: input.birthTime !== null,
    utc: new Date(utcMs).toISOString(),
    julianDay: jd,
    ayanamsa: ephemeris.ayanamsa(jd),
    ascendant,
    planets,
    dashas,
    current: currentDasha(dashas, now),
    engine: ephemeris.name,
  };
}
