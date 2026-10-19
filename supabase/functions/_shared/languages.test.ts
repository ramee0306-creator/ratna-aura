import { describe, expect, it } from 'vitest';

import { LANGUAGES } from '../../../app/src/i18n/languages';
import { isLanguage, LANGUAGE_NAMES } from './languages.ts';

describe('server language list', () => {
  it('matches the app', () => {
    expect(LANGUAGE_NAMES).toEqual(Object.fromEntries(LANGUAGES.map((l) => [l.code, l.englishName])));
  });

  it('rejects unknown codes', () => {
    expect(isLanguage('hi')).toBe(true);
    expect(isLanguage('xx')).toBe(false);
    expect(isLanguage('toString')).toBe(false);
  });
});

describe('database language list', () => {
  it('the latest migration allows exactly the app languages on the account', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const dir = new URL('../../migrations/', import.meta.url);
    const sql = readdirSync(dir)
      .sort()
      .map((f) => readFileSync(new URL(f, dir), 'utf8'))
      .join('\n');
    const last = [...sql.matchAll(/preferred_language in \(([^)]*)\)/g)].at(-1)![1];
    expect(last.match(/'([\w-]+)'/g)!.map((s) => s.slice(1, -1)).sort()).toEqual(LANGUAGES.map((l) => l.code).sort());
  });
});
