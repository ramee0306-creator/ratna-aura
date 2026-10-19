// The main personal numbers.
import { type CalendarDate, dateDigits } from './date.ts';
import { isVowelAt, letterValue, nameWords, type NumerologySystem } from './letters.ts';
import { digitSum, reduce } from './reduce.ts';

/** Mulank (psychic / root number): the day of birth reduced to 1–9. Born on the 29th -> 2+9 = 11 -> 2. */
export function mulank(birth: CalendarDate): number {
  return reduce(birth.day);
}

/** Bhagyank (destiny number): every digit of DD MM YYYY added and reduced to 1–9. */
export function bhagyank(birth: CalendarDate): number {
  return reduce(dateDigits(birth).reduce((a, b) => a + b, 0));
}

/**
 * Western (Pythagorean) life path: day, month and year are reduced separately,
 * then added — master numbers 11, 22 and 33 are kept at every step.
 */
export function lifePath(birth: CalendarDate): number {
  const keep = { keepMasters: true };
  return reduce(reduce(birth.day, keep) + reduce(birth.month, keep) + reduce(digitSum(birth.year), keep), keep);
}

export type NameNumber = {
  /** The full total before reducing (the "compound" number, e.g. 32). */
  compound: number;
  /** The reduced number (1–9; Pythagorean may also give 11, 22 or 33). */
  number: number;
};

type LetterFilter = 'all' | 'vowels' | 'consonants';

function nameTotal(name: string, system: NumerologySystem, which: LetterFilter): number {
  let total = 0;
  for (const word of nameWords(name)) {
    for (let i = 0; i < word.length; i++) {
      const vowel = isVowelAt(word, i);
      if (which === 'all' || (which === 'vowels') === vowel) total += letterValue(word[i], system);
    }
  }
  return total;
}

function toNameNumber(compound: number, system: NumerologySystem): NameNumber {
  return { compound, number: reduce(compound, { keepMasters: system === 'pythagorean' }) };
}

/** Name number / expression number: all letters of the name. */
export function nameNumber(name: string, system: NumerologySystem): NameNumber {
  return toNameNumber(nameTotal(name, system, 'all'), system);
}

/** Soul urge (heart's desire): vowels only — what you want inside. */
export function soulUrge(name: string, system: NumerologySystem): NameNumber {
  return toNameNumber(nameTotal(name, system, 'vowels'), system);
}

/** Personality: consonants only — how others first see you. */
export function personality(name: string, system: NumerologySystem): NameNumber {
  return toNameNumber(nameTotal(name, system, 'consonants'), system);
}

/**
 * Maturity number: destiny + name number, which grows in importance after about age 35.
 * Pythagorean uses life path + expression (keeping master numbers);
 * Chaldean uses Bhagyank + name number.
 */
export function maturity(birth: CalendarDate, name: string, system: NumerologySystem): number {
  const name_ = nameNumber(name, system).number;
  if (system === 'pythagorean') return reduce(lifePath(birth) + name_, { keepMasters: true });
  return reduce(bhagyank(birth) + name_);
}

export type CoreNumbers = {
  mulank: number;
  bhagyank: number;
  lifePath: number;
  name: NameNumber;
  soulUrge: NameNumber;
  personality: NameNumber;
  maturity: number;
};

/** Everything on the "My Numbers" screen in one call. */
export function coreNumbers(name: string, birth: CalendarDate, system: NumerologySystem): CoreNumbers {
  return {
    mulank: mulank(birth),
    bhagyank: bhagyank(birth),
    lifePath: lifePath(birth),
    name: nameNumber(name, system),
    soulUrge: soulUrge(name, system),
    personality: personality(name, system),
    maturity: maturity(birth, name, system),
  };
}
