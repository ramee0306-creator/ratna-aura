import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LANGUAGES } from './languages';
import en from './locales/en';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(tree).flatMap(([k, v]) => (typeof v === 'string' ? [[prefix + k, v]] : Object.entries(flatten(v, `${prefix}${k}.`)))),
  );
}

const placeholders = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((p) => p.replace(/\s/g, '')).sort();
const english = flatten(en as unknown as Tree);
const available = readdirSync(join(__dirname, 'locales'))
  .map((f) => f.replace(/\.ts$/, ''))
  .filter((code) => code !== 'en' && LANGUAGES.some((l) => l.code === code));

describe.each(available)('translation "%s"', (code) => {
  it('has every English text, with the same {{placeholders}}, and nothing left empty', async () => {
    const translated = flatten((await import(`./locales/${code}.ts`)).default as Tree);
    expect(Object.keys(translated).sort()).toEqual(Object.keys(english).sort());
    for (const [key, text] of Object.entries(english)) {
      expect(placeholders(translated[key]), `${code}: ${key}`).toEqual(placeholders(text));
      expect(translated[key].trim().length, `${code}: ${key} is empty`).toBeGreaterThan(0);
    }
  });
});
