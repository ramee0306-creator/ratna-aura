// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// A calendar date without time zones, e.g. a date of birth.

export type CalendarDate = { year: number; month: number; day: number };

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDate({ year, month, day }: CalendarDate): boolean {
  if (![year, month, day].every(Number.isInteger)) return false;
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  return day <= daysInMonth(year, month);
}

export function daysInMonth(year: number, month: number): number {
  return [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Reads "YYYY-MM-DD". Returns null if it is not a real date. */
export function parseIsoDate(text: string): CalendarDate | null {
  const m = ISO.exec(text.trim());
  if (!m) return null;
  const date = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  return isValidDate(date) ? date : null;
}

/** Reads "DD/MM/YYYY" (also accepts "-" or "." between parts). Returns null if it is not a real date. */
export function parseIndianDate(text: string): CalendarDate | null {
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text.trim());
  if (!m) return null;
  const date = { year: Number(m[3]), month: Number(m[2]), day: Number(m[1]) };
  return isValidDate(date) ? date : null;
}

export function toIsoDate({ year, month, day }: CalendarDate): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** All digits of DD MM YYYY, in order: 14 Aug 1990 -> [1,4,0,8,1,9,9,0]. */
export function dateDigits({ year, month, day }: CalendarDate): number[] {
  const text = String(day).padStart(2, '0') + String(month).padStart(2, '0') + String(year).padStart(4, '0');
  return [...text].map(Number);
}

/** Age in whole years on `today`. */
export function ageOn(birth: CalendarDate, today: CalendarDate): number {
  let age = today.year - birth.year;
  if (today.month < birth.month || (today.month === birth.month && today.day < birth.day)) age -= 1;
  return age;
}
