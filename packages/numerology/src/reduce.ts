// Numerology works by adding digits together until a single digit remains,
// e.g. 1990 -> 1+9+9+0 = 19 -> 1+9 = 10 -> 1+0 = 1.

/** 11, 22 and 33 are "master numbers": the Pythagorean method stops reducing at them. */
export const MASTER_NUMBERS = [11, 22, 33] as const;

export const isMasterNumber = (n: number) => (MASTER_NUMBERS as readonly number[]).includes(n);

/** Adds the digits of a whole number once: 1990 -> 19. */
export function digitSum(n: number): number {
  assertWholeNumber(n);
  let sum = 0;
  for (const ch of String(n)) sum += Number(ch);
  return sum;
}

/**
 * Keeps adding digits until one digit is left (1–9, or 0 for 0).
 * With `keepMasters`, stops early at 11, 22 or 33.
 */
export function reduce(n: number, { keepMasters = false }: { keepMasters?: boolean } = {}): number {
  assertWholeNumber(n);
  let value = n;
  while (value > 9 && !(keepMasters && isMasterNumber(value))) value = digitSum(value);
  return value;
}

/** Adds every digit found in a string, ignoring everything else: "98-76" -> 30. */
export function sumDigitsIn(text: string): number {
  let sum = 0;
  for (const ch of text) if (ch >= '0' && ch <= '9') sum += Number(ch);
  return sum;
}

function assertWholeNumber(n: number) {
  if (!Number.isInteger(n) || n < 0) throw new RangeError(`Expected a whole number ≥ 0, got ${n}`);
}
