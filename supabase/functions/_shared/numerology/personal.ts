// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// The yearly, monthly and daily cycles that change over time.
import type { CalendarDate } from './date.ts';
import { digitSum, reduce } from './reduce.ts';

/** Personal year: birth day + birth month + the calendar year, reduced to 1–9. */
export function personalYear(birth: CalendarDate, year: number): number {
  return reduce(digitSum(birth.day) + digitSum(birth.month) + digitSum(year));
}

/** Personal month: personal year + the calendar month, reduced to 1–9. */
export function personalMonth(birth: CalendarDate, year: number, month: number): number {
  return reduce(personalYear(birth, year) + month);
}

/** Personal day: personal month + the day of the month, reduced to 1–9. */
export function personalDay(birth: CalendarDate, on: CalendarDate): number {
  return reduce(personalMonth(birth, on.year, on.month) + on.day);
}

export function personalCycles(birth: CalendarDate, on: CalendarDate) {
  return {
    year: personalYear(birth, on.year),
    month: personalMonth(birth, on.year, on.month),
    day: personalDay(birth, on),
  };
}
