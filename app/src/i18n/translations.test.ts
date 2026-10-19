import { describe, expect, it } from 'vitest';

import { LANGUAGES } from './languages';
import en from './locales/en';
import { TRANSLATIONS } from './translations';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [[prefix + k, v]] : Object.entries(flatten(v, `${prefix}${k}.`)))),
  );
}

const placeholders = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort();
const english = flatten(en as unknown as Tree);
const codes = LANGUAGES.map((l) => l.code).filter((code) => code !== 'en' && TRANSLATIONS[code]);

describe.each(codes)('translation "%s"', (code) => {
  it('has every English text, with the same {{placeholders}}, and nothing left empty', () => {
    const translated = flatten(TRANSLATIONS[code] as unknown as Tree);
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
    for (const [key, text] of Object.entries(english)) {
      expect(placeholders(translated[key]), `${code}: ${key}`).toEqual(placeholders(text));
      expect(translated[key].trim().length, `${code}: ${key} is empty`).toBeGreaterThan(0);
    }
  });
});

it('offers at least English and Hindi', () => {
  expect(TRANSLATIONS.en).toBeDefined();
  expect(TRANSLATIONS.hi).toBeDefined();
});

it('fills extra plural forms (Russian "few"/"many", Arabic "two"…) from "other"', async () => {
  const { withAllPluralForms } = await import('./plural');
  expect(withAllPluralForms({ a: { n_one: '1 item', n_other: '{{count}} items' }, b: 'x' })).toEqual({
    a: { n_one: '1 item', n_other: '{{count}} items', n_zero: '{{count}} items', n_two: '{{count}} items', n_few: '{{count}} items', n_many: '{{count}} items' },
    b: 'x',
  });
});
