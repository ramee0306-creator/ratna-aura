// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// Letter values for the two numerology systems.

export type NumerologySystem = 'chaldean' | 'pythagorean';

/**
 * Chaldean values (as used by Cheiro and most Indian numerologists).
 * No letter is given 9 — that number is held sacred in this system.
 */
export const CHALDEAN: Readonly<Record<string, number>> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Pythagorean values: A–I = 1–9, J–R = 1–9, S–Z = 1–8. */
export const PYTHAGOREAN: Readonly<Record<string, number>> = Object.fromEntries(
  [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((letter, i) => [letter, (i % 9) + 1]),
);

export const letterValue = (letter: string, system: NumerologySystem): number =>
  (system === 'chaldean' ? CHALDEAN : PYTHAGOREAN)[letter] ?? 0;

/**
 * Turns a name into upper-case English letters grouped by word.
 * Accents are removed ("José" -> "JOSE"); digits and symbols are dropped.
 */
export function nameWords(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .split(/[^A-Z]+/)
    .filter(Boolean);
}

/** True if the text contains at least one English letter and no letters from other scripts. */
export function isLatinName(name: string): boolean {
  const stripped = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return /[A-Za-z]/.test(stripped) && !/\p{L}/u.test(stripped.replace(/[A-Za-z]/g, ''));
}

const PLAIN_VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

/**
 * Is the letter at `index` of `word` a vowel?
 * A, E, I, O, U always are. Y counts as a vowel only when it sounds like one,
 * which we approximate as: not next to another vowel ("MYRA", "LYNN" — yes;
 * "YASH", "VIJAY", "SHREYA" — no).
 */
export function isVowelAt(word: string, index: number): boolean {
  const letter = word[index];
  if (PLAIN_VOWELS.has(letter)) return true;
  if (letter !== 'Y') return false;
  return !PLAIN_VOWELS.has(word[index - 1] ?? '') && !PLAIN_VOWELS.has(word[index + 1] ?? '');
}
