import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { LANGUAGES, type LanguageCode } from './languages';
import bn from './locales/bn';
import en, { type Translation } from './locales/en';
import gu from './locales/gu';
import hi from './locales/hi';

export { dateLocale, type LanguageCode } from './languages';

/** Every finished translation. Languages in languages.ts without a file here are not offered yet. */
const TRANSLATIONS: Partial<Record<LanguageCode, Translation>> = { en, hi, bn, gu };

/** The languages offered on the language screen, in display order. */
export const AVAILABLE_LANGUAGES = LANGUAGES.filter((l) => TRANSLATIONS[l.code]);

const i18n = createInstance();
const STORAGE_KEY = 'app.language';
let chosen = false;

const isAvailable = (code: string | null | undefined): code is LanguageCode => AVAILABLE_LANGUAGES.some((l) => l.code === code);

/** True once the person has picked a language (on this phone). */
export const isLanguageChosen = () => chosen;

export async function initI18n(): Promise<void> {
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — fall back to the phone's language.
  }
  chosen = isAvailable(saved);
  const device = getLocales()[0]?.languageCode;
  const lng = isAvailable(saved) ? saved : isAvailable(device) ? device : 'en';

  await i18n.use(initReactI18next).init({
    resources: Object.fromEntries(Object.entries(TRANSLATIONS).map(([code, translation]) => [code, { translation }])),
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export async function setLanguage(code: LanguageCode): Promise<void> {
  chosen = true;
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not critical: language just won't be remembered.
  }
}
