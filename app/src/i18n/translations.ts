// Every finished translation. A language listed in languages.ts appears in the app
// as soon as its file is imported here.
import type { LanguageCode } from './languages';
import assamese from './locales/as';
import bn from './locales/bn';
import en, { type Translation } from './locales/en';
import gu from './locales/gu';
import hi from './locales/hi';
import kn from './locales/kn';
import ml from './locales/ml';
import mr from './locales/mr';
import or from './locales/or';
import pa from './locales/pa';
import ta from './locales/ta';
import te from './locales/te';

export const TRANSLATIONS: Partial<Record<LanguageCode, Translation>> = {
  en,
  hi,
  mr,
  bn,
  te,
  ta,
  gu,
  kn,
  ml,
  or,
  pa,
  as: assamese,
};
