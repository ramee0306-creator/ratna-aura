import { expect, it } from 'vitest';

import { LANGUAGES } from '@/i18n/languages';

import { SPEECH_LANGUAGES, speechLocale } from './locales';

it('every app language has a speech setting', () => {
  expect([...SPEECH_LANGUAGES].sort()).toEqual(LANGUAGES.map((l) => l.code).sort());
});

it('uses Indian voices, and none for Santali (Ol Chiki)', () => {
  expect(speechLocale('hi')).toBe('hi-IN');
  expect(speechLocale('bho')).toBe('hi-IN');
  expect(speechLocale('tcy')).toBe('kn-IN');
  expect(speechLocale('sat')).toBeNull();
  expect(speechLocale('xx')).toBe('en-IN');
});
