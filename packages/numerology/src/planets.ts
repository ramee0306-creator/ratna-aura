// Indian numerology links each number to a planet (graha), and uses the classical
// Vedic planetary friendships (naisargika maitri) to judge which numbers support each other.
import { reduce } from './reduce.ts';

export type Planet = 'sun' | 'moon' | 'jupiter' | 'rahu' | 'mercury' | 'venus' | 'ketu' | 'saturn' | 'mars';
export type Relation = 'same' | 'friend' | 'neutral' | 'enemy';
export type PersonNumbers = { mulank: number; bhagyank: number };
export type Weekday = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

export const NUMBER_PLANET: Readonly<Record<number, Planet>> = {
  1: 'sun',
  2: 'moon',
  3: 'jupiter',
  4: 'rahu',
  5: 'mercury',
  6: 'venus',
  7: 'ketu',
  8: 'saturn',
  9: 'mars',
};

export const PLANET_NUMBER = Object.fromEntries(
  Object.entries(NUMBER_PLANET).map(([n, p]) => [p, Number(n)]),
) as Readonly<Record<Planet, number>>;

/** Friends and enemies of each planet; every planet not listed is neutral. */
const FRIENDSHIP: Readonly<Record<Planet, { friends: Planet[]; enemies: Planet[] }>> = {
  sun: { friends: ['moon', 'mars', 'jupiter'], enemies: ['venus', 'saturn', 'rahu', 'ketu'] },
  moon: { friends: ['sun', 'mercury'], enemies: ['rahu', 'ketu'] },
  mars: { friends: ['sun', 'moon', 'jupiter'], enemies: ['mercury', 'rahu'] },
  mercury: { friends: ['sun', 'venus', 'rahu'], enemies: ['moon'] },
  jupiter: { friends: ['sun', 'moon', 'mars'], enemies: ['mercury', 'venus'] },
  venus: { friends: ['mercury', 'saturn', 'rahu', 'ketu'], enemies: ['sun', 'moon'] },
  saturn: { friends: ['mercury', 'venus', 'rahu', 'ketu'], enemies: ['sun', 'moon', 'mars'] },
  rahu: { friends: ['mercury', 'venus', 'saturn'], enemies: ['sun', 'moon', 'mars'] },
  ketu: { friends: ['mars', 'venus', 'saturn'], enemies: ['sun', 'moon'] },
};

/** How planet `a` regards planet `b`. (Friendship is not always mutual.) */
export function planetRelation(a: Planet, b: Planet): Relation {
  if (a === b) return 'same';
  if (FRIENDSHIP[a].friends.includes(b)) return 'friend';
  if (FRIENDSHIP[a].enemies.includes(b)) return 'enemy';
  return 'neutral';
}

/** Planet ruling any whole number ≥ 1 (reduced to 1–9 first). */
export function planetOf(n: number): Planet {
  const single = reduce(n);
  if (single < 1) throw new RangeError('Numbers below 1 have no planet');
  return NUMBER_PLANET[single];
}

/** How number `a` regards number `b`. */
export const numberRelation = (a: number, b: number): Relation => planetRelation(planetOf(a), planetOf(b));

const RELATION_POINTS: Record<Relation, number> = { same: 2, friend: 2, neutral: 1, enemy: 0 };

/**
 * How well a number suits a person, 0–4: how their Mulank regards it plus
 * how their Bhagyank regards it (friend 2, neutral 1, enemy 0).
 */
export function harmonyScore(n: number, person: PersonNumbers): number {
  return RELATION_POINTS[numberRelation(person.mulank, n)] + RELATION_POINTS[numberRelation(person.bhagyank, n)];
}

export type Harmony = 'supportive' | 'neutral' | 'challenging';

export function harmony(n: number, person: PersonNumbers): Harmony {
  const score = harmonyScore(n, person);
  return score >= 3 ? 'supportive' : score === 2 ? 'neutral' : 'challenging';
}

const PLANET_DAY: Readonly<Record<Planet, Weekday>> = {
  sun: 'sunday',
  moon: 'monday',
  mars: 'tuesday',
  mercury: 'wednesday',
  jupiter: 'thursday',
  venus: 'friday',
  saturn: 'saturday',
  rahu: 'saturday',
  ketu: 'tuesday',
};

const WEEK: Weekday[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export type Colour =
  | 'gold' | 'orange' | 'white' | 'cream' | 'yellow' | 'saffron' | 'grey' | 'smokyBlue'
  | 'green' | 'pink' | 'lightBlue' | 'brown' | 'navy' | 'black' | 'red' | 'maroon';

const PLANET_COLOURS: Readonly<Record<Planet, Colour[]>> = {
  sun: ['gold', 'orange'],
  moon: ['white', 'cream'],
  jupiter: ['yellow', 'saffron'],
  rahu: ['grey', 'smokyBlue'],
  mercury: ['green'],
  venus: ['white', 'pink', 'lightBlue'],
  ketu: ['grey', 'brown'],
  saturn: ['navy', 'black'],
  mars: ['red', 'maroon'],
};

export type Gem = 'ruby' | 'pearl' | 'yellowSapphire' | 'hessonite' | 'emerald' | 'diamond' | 'catsEye' | 'blueSapphire' | 'redCoral';

/** The navaratna stone traditionally linked with each planet. */
export const PLANET_GEM: Readonly<Record<Planet, Gem>> = {
  sun: 'ruby',
  moon: 'pearl',
  jupiter: 'yellowSapphire',
  rahu: 'hessonite',
  mercury: 'emerald',
  venus: 'diamond',
  ketu: 'catsEye',
  saturn: 'blueSapphire',
  mars: 'redCoral',
};

export type LuckyFactors = {
  planet: Planet;
  /** Numbers the Mulank regards as itself or a friend, and the Bhagyank does not oppose. */
  numbers: number[];
  /** Numbers both the Mulank and Bhagyank regard as enemies. */
  avoid: number[];
  days: Weekday[];
  colours: Colour[];
  gem: Gem;
};

export function luckyFactors(person: PersonNumbers): LuckyFactors {
  const planet = planetOf(person.mulank);
  const numbers: number[] = [];
  const avoid: number[] = [];
  for (let n = 1; n <= 9; n++) {
    const fromMulank = numberRelation(person.mulank, n);
    const fromBhagyank = numberRelation(person.bhagyank, n);
    if ((fromMulank === 'same' || fromMulank === 'friend') && fromBhagyank !== 'enemy') numbers.push(n);
    if (fromMulank === 'enemy' && fromBhagyank === 'enemy') avoid.push(n);
  }
  const daySet = new Set([PLANET_DAY[planet], ...numbers.map((n) => PLANET_DAY[planetOf(n)])]);
  return {
    planet,
    numbers,
    avoid,
    days: WEEK.filter((d) => daySet.has(d)),
    colours: PLANET_COLOURS[planet],
    gem: PLANET_GEM[planet],
  };
}
