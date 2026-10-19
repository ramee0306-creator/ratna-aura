// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// The "vibration" of everyday numbers — mobile, vehicle, house — and business names,
// and how well each suits a person.
import { nameNumber } from './core.ts';
import { CHALDEAN } from './letters.ts';
import { type Harmony, harmony, type PersonNumbers } from './planets.ts';
import { reduce, sumDigitsIn } from './reduce.ts';

export type Vibration = {
  /** Total before reducing */
  compound: number;
  /** Reduced to 1–9 */
  number: number;
  /** How well it suits the person (only when a person is given) */
  harmony: Harmony | null;
};

const vibration = (compound: number, person?: PersonNumbers): Vibration => {
  const number = reduce(compound);
  return { compound, number, harmony: person && number > 0 ? harmony(number, person) : null };
};

/** Indian mobile numbers: keeps the last 10 digits (drops +91 or a leading 0). Null if it is not 10 digits. */
export function cleanMobile(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export type MobileVibration = Vibration & {
  digits: string;
  zeros: number;
  lastDigit: number;
};

export function mobileVibration(input: string, person?: PersonNumbers): MobileVibration | null {
  const digits = cleanMobile(input);
  if (!digits) return null;
  return {
    ...vibration(sumDigitsIn(digits), person),
    digits,
    zeros: [...digits].filter((d) => d === '0').length,
    lastDigit: Number(digits[digits.length - 1]),
  };
}

/** Adds digits and (Chaldean) letter values, e.g. for "B-402" or "MH12AB1234". */
function alphanumericTotal(text: string): number {
  let total = sumDigitsIn(text);
  for (const ch of text.toUpperCase()) total += CHALDEAN[ch] ?? 0;
  return total;
}

const hasDigit = (text: string) => /\d/.test(text);

export type VehicleVibration = Vibration & {
  /** The registration with spaces and dashes removed, upper-case */
  plate: string;
  /** Digits and letters together (some numerologists use this instead) */
  withLetters: Vibration;
};

/**
 * Vehicle registration (e.g. "MH 12 AB 1234"). The main number uses the digits only,
 * as most Indian numerologists do; the letters-included total is also given.
 */
export function vehicleVibration(input: string, person?: PersonNumbers): VehicleVibration | null {
  const plate = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (plate.length < 4 || !hasDigit(plate)) return null;
  return { ...vibration(sumDigitsIn(plate), person), plate, withLetters: vibration(alphanumericTotal(plate), person) };
}

/** House / flat number, letters included (e.g. "B-402" -> 2+4+0+2 = 8). */
export function houseVibration(input: string, person?: PersonNumbers): Vibration | null {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!hasDigit(clean)) return null;
  return vibration(alphanumericTotal(clean), person);
}

/** Business or brand name, using the Chaldean name number. */
export function businessVibration(name: string, person?: PersonNumbers): Vibration | null {
  const { compound } = nameNumber(name, 'chaldean');
  if (compound === 0) return null;
  return vibration(compound, person);
}
