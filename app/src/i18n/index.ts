import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en';
import hi from './locales/hi';

/**
 * To add a language (e.g. Marathi):
 *  1. copy locales/hi.ts to locales/mr.ts and translate it,
 *  2. import it below and add it to `resources` and `LANGUAGES`.
 */
export const LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

const resources = { en: { translation: en }, hi: { translation: hi } };
const i18n = createInstance();
const STORAGE_KEY = 'app.language';

function isSupported(code: string | null | undefined): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

export async function initI18n(): Promise<void> {
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — fall back to the phone's language.
  }
  const device = getLocales()[0]?.languageCode;
  const lng = isSupported(saved) ? saved : isSupported(device) ? device : 'en';

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export async function setLanguage(code: LanguageCode): Promise<void> {
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not critical: language just won't be remembered.
  }
}
