// Every language the app offers, in the order shown on the language screen.
// To add one: add it here, add locales/<code>.ts, numerology.<code>.ts and kundli.<code>.ts
// (copies of the English files, translated), and register them in i18n/index.ts.

export const LANGUAGES = [
  { code: 'en', nativeName: 'English', englishName: 'English' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi' },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const isSupported = (code: string | null | undefined): code is LanguageCode => LANGUAGES.some((l) => l.code === code);

/** Locale used for dates and numbers, e.g. "hi-IN". */
export const dateLocale = (code: string) => (isSupported(code) ? `${code}-IN` : 'en-IN');
