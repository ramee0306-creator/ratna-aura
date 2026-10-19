// AUTO-COPIED from packages/numerology/src — edit the original, then run: npm run sync-shared
// Suggests small spelling changes that give a name number which suits the person
// (Chaldean system, as is usual for name correction in India).
import { nameNumber } from './core.ts';
import { nameWords } from './letters.ts';
import { type Harmony, harmony, harmonyScore, type PersonNumbers } from './planets.ts';

export type NameOption = {
  spelling: string;
  /** Chaldean total before reducing */
  compound: number;
  number: number;
  harmony: Harmony;
  /** Number of letter changes from the original spelling (0 for the original). */
  changes: number;
};

/** Consonants that are often written with an extra "h" in Indian names (Amit → Amith, Sidarth → Siddharth). */
const ASPIRATES = new Set(['B', 'C', 'D', 'G', 'J', 'K', 'P', 'S', 'T']);
/** Consonants that read naturally when doubled between vowels (Amit → Ammit, Sunil → Sunnil). */
const DOUBLABLE = new Set(['B', 'D', 'G', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T']);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
const isVowel = (ch: string | undefined) => ch !== undefined && VOWELS.has(ch);

/**
 * Spellings one change away that still read and sound like the same name.
 * (Doubling the first letter, "Ppriya", or stacking vowels, "Raoo", is never suggested.)
 */
function oneChangeVariants(word: string): string[] {
  const out = new Set<string>();
  const insertAfter = (i: number, text: string) => out.add(word.slice(0, i + 1) + text + word.slice(i + 1));
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const prev = word[i - 1];
    const next = word[i + 1];
    // Double a consonant between vowels: Amit → Ammit.
    if (DOUBLABLE.has(ch) && isVowel(prev) && isVowel(next)) insertAfter(i, ch);
    // Lengthen A, E or O when it stands alone: Amit → Aamit, Sharma → Shaarma.
    if ((ch === 'A' || ch === 'E' || ch === 'O') && !isVowel(prev) && !isVowel(next)) insertAfter(i, ch);
    // Undo a doubled letter: Siddharth → Sidharth, Aamir → Amir.
    if (next === ch) out.add(word.slice(0, i) + word.slice(i + 1));
    // Add an "h" after a consonant, before a vowel or at the end: Amit → Amith, Sidarth → Sidharth.
    if (ASPIRATES.has(ch) && prev !== ch && (next === undefined || isVowel(next))) insertAfter(i, 'H');
    // Long and short vowels: Rina ↔ Reena, Sunil ↔ Soonil.
    if (ch === 'I' && !isVowel(prev) && !isVowel(next)) out.add(word.slice(0, i) + 'EE' + word.slice(i + 1));
    if (ch === 'U' && !isVowel(prev) && !isVowel(next)) out.add(word.slice(0, i) + 'OO' + word.slice(i + 1));
    if (ch === 'E' && next === 'E') out.add(word.slice(0, i) + 'I' + word.slice(i + 2));
    if (ch === 'O' && next === 'O') out.add(word.slice(0, i) + 'U' + word.slice(i + 2));
  }
  // A soft ending: Arjun → Arjuna, Ananya → Ananyah.
  const last = word[word.length - 1];
  if (word.length > 2 && !isVowel(last) && last !== 'H' && last !== 'Y') out.add(word + 'A');
  if (word.length > 2 && isVowel(last) && word[word.length - 2] !== last) out.add(word + 'H');
  out.delete(word);
  return [...out];
}

const titleCase = (word: string) => word.charAt(0) + word.slice(1).toLowerCase();

function describe(words: string[], person: PersonNumbers, changes: number): NameOption {
  const spelling = words.map(titleCase).join(' ');
  const { compound, number } = nameNumber(spelling, 'chaldean');
  return { spelling, compound, number, harmony: harmony(number, person), changes };
}

export type NameCorrection = {
  current: NameOption;
  /** Supportive spellings that suit the person better than the current one, fewest changes first. */
  suggestions: NameOption[];
};

/**
 * Tries every one-change spelling of every word, then (if needed) two changes,
 * and keeps the ones whose name number is "supportive" for this person and
 * scores higher than the current spelling. Empty when the current name is already the best fit.
 */
export function suggestNameSpellings(name: string, person: PersonNumbers, { limit = 8 } = {}): NameCorrection {
  const words = nameWords(name);
  if (words.length === 0) throw new Error('The name must contain English letters');
  const current = describe(words, person, 0);
  const currentScore = harmonyScore(current.number, person);

  const seen = new Set([words.join(' ')]);
  const found: NameOption[] = [];
  let frontier: string[][] = [words];

  for (let changes = 1; changes <= 2 && found.length < limit; changes++) {
    const next: string[][] = [];
    for (const base of frontier) {
      base.forEach((word, w) => {
        for (const variant of oneChangeVariants(word)) {
          const candidate = base.map((x, i) => (i === w ? variant : x));
          const key = candidate.join(' ');
          if (seen.has(key)) continue;
          seen.add(key);
          next.push(candidate);
          const option = describe(candidate, person, changes);
          if (option.harmony === 'supportive' && harmonyScore(option.number, person) > currentScore) found.push(option);
        }
      });
    }
    frontier = next;
  }

  // Prefer: fewer changes, then the strongest harmony, then the shorter spelling.
  found.sort(
    (x, y) =>
      x.changes - y.changes ||
      harmonyScore(y.number, person) - harmonyScore(x.number, person) ||
      x.spelling.length - y.spelling.length ||
      x.spelling.localeCompare(y.spelling),
  );
  return { current, suggestions: found.slice(0, limit) };
}
