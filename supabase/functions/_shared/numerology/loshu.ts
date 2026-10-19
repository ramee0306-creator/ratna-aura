// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// The Lo Shu grid: a 3×3 magic square (every row, column and diagonal adds to 15)
// filled with the digits of the date of birth, as used in Indian numerology.
import { bhagyank, mulank } from './core.ts';
import { type CalendarDate, dateDigits } from './date.ts';
import { reduce } from './reduce.ts';

/** The fixed layout of the Lo Shu square, top row first. */
export const LO_SHU_LAYOUT = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
] as const;

export type Gender = 'male' | 'female';

/**
 * Kua number (from Feng Shui), based on the year of birth and gender.
 * Uses the calendar year (some practitioners switch years at Chinese New Year instead).
 */
export function kuaNumber(year: number, gender: Gender): number {
  const s = reduce(year % 100);
  let kua: number;
  if (year < 2000) kua = gender === 'male' ? reduce(10 - s) : reduce(s + 5);
  else kua = gender === 'male' ? (9 - s === 0 ? 9 : 9 - s) : reduce(s + 6);
  // There is no Kua 5: men take 2 and women take 8.
  if (kua === 5) kua = gender === 'male' ? 2 : 8;
  return kua;
}

export type PlaneKey = 'mental' | 'emotional' | 'practical' | 'thought' | 'will' | 'action' | 'golden' | 'silver';

/** The eight lines of the grid. Each one describes a strength when all three numbers are present. */
export const PLANES: ReadonlyArray<{ key: PlaneKey; numbers: readonly [number, number, number] }> = [
  { key: 'mental', numbers: [4, 9, 2] },
  { key: 'emotional', numbers: [3, 5, 7] },
  { key: 'practical', numbers: [8, 1, 6] },
  { key: 'thought', numbers: [4, 3, 8] },
  { key: 'will', numbers: [9, 5, 1] },
  { key: 'action', numbers: [2, 7, 6] },
  { key: 'golden', numbers: [4, 5, 6] },
  { key: 'silver', numbers: [2, 5, 8] },
];

export type LoShuGrid = {
  /** How many times each number 1–9 appears. */
  counts: Record<number, number>;
  /** The digits that were placed, in the order they were added (zeros are skipped). */
  digits: number[];
  missing: number[];
  repeated: { number: number; count: number }[];
  /** Lines where all three numbers are present. */
  completePlanes: PlaneKey[];
  /** Lines where all three numbers are absent. */
  emptyPlanes: PlaneKey[];
  mulank: number;
  bhagyank: number;
  kua: number | null;
};

/**
 * Builds the grid from the date of birth, plus Bhagyank, plus Mulank (only when the
 * day has two digits — for days 1–9 that digit is already in the date), plus the
 * Kua number when a gender is given.
 */
export function loShuGrid(birth: CalendarDate, options: { gender?: Gender } = {}): LoShuGrid {
  const m = mulank(birth);
  const b = bhagyank(birth);
  const kua = options.gender ? kuaNumber(birth.year, options.gender) : null;

  const digits = dateDigits(birth).filter((d) => d !== 0);
  digits.push(b);
  if (birth.day >= 10) digits.push(m);
  if (kua !== null) digits.push(kua);

  const counts: Record<number, number> = {};
  for (let n = 1; n <= 9; n++) counts[n] = 0;
  for (const d of digits) counts[d] += 1;

  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return {
    counts,
    digits,
    missing: all.filter((n) => counts[n] === 0),
    repeated: all.filter((n) => counts[n] > 1).map((n) => ({ number: n, count: counts[n] })),
    completePlanes: PLANES.filter((p) => p.numbers.every((n) => counts[n] > 0)).map((p) => p.key),
    emptyPlanes: PLANES.filter((p) => p.numbers.every((n) => counts[n] === 0)).map((p) => p.key),
    mulank: m,
    bhagyank: b,
    kua,
  };
}
