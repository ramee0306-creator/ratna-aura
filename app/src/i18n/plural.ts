// Plural forms for languages that have more than "one" and "other".

type Tree = { [key: string]: string | Tree };

/**
 * Some languages have extra plural forms (Russian "few"/"many", Arabic "zero"/"two" …).
 * Our texts give "one" and "other"; any missing form reuses "other", so the text
 * never falls back to English.
 */
export function withAllPluralForms<T>(tree: T): T {
  const copy: Tree = { ...(tree as Tree) };
  for (const [key, value] of Object.entries(copy)) {
    if (typeof value !== 'string') {
      copy[key] = withAllPluralForms(value);
    } else if (key.endsWith('_other')) {
      const base = key.slice(0, -'_other'.length);
      for (const form of ['zero', 'two', 'few', 'many']) copy[`${base}_${form}`] ??= value;
    }
  }
  return copy as T;
}
