import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';

import { fromDeviceLocale, isRtl, LANGUAGES, type LanguageCode } from './languages';
import { withAllPluralForms } from './plural';
import { TRANSLATIONS } from './translations';

export { dateLocale, languageInfo, type LanguageCode } from './languages';

/** The languages offered on the language screen (those with a finished translation), in display order. */
export const AVAILABLE_LANGUAGES = LANGUAGES.filter((l) => TRANSLATIONS[l.code]);

const i18n = createInstance();
const STORAGE_KEY = 'app.language';
let chosen = false;

const isAvailable = (code: string | null | undefined): code is LanguageCode => AVAILABLE_LANGUAGES.some((l) => l.code === code);

/** True once the person has picked a language (on this phone). */
export const isLanguageChosen = () => chosen;

/**
 * Urdu, Arabic, Persian and other right-to-left languages flip the whole layout.
 * On a phone that only takes effect after the app restarts; returns true if a restart is needed.
 */
function applyDirection(code: string): boolean {
  const rtl = isRtl(code);
  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    return false;
  }
  if (I18nManager.isRTL === rtl) return false;
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
  return true;
}

export async function initI18n(): Promise<void> {
  let saved: string | null = null;
  try {
    saved = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage unavailable — fall back to the phone's language.
  }
  chosen = isAvailable(saved);
  const device = fromDeviceLocale(getLocales()[0] ?? {});
  const lng = isAvailable(saved) ? saved : isAvailable(device) ? device : 'en';
  applyDirection(lng);

  await i18n.use(initReactI18next).init({
    resources: Object.fromEntries(
      Object.entries(TRANSLATIONS).map(([code, translation]) => [code, { translation: withAllPluralForms(translation) }]),
    ),
    lng,
    fallbackLng: 'en',
    // Our codes such as "zh-TW" are used exactly as written.
    load: 'currentOnly',
    interpolation: { escapeValue: false },
  });
}

/** Switches language. Returns true if the app must be reopened to finish (change of writing direction). */
export async function setLanguage(code: LanguageCode): Promise<boolean> {
  chosen = true;
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Not critical: language just won't be remembered.
  }
  return applyDirection(code);
}
