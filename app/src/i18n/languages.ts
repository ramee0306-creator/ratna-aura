// Every language the app offers: English and the languages of India, in the order shown on the language screen.
// A language appears in the app as soon as its translation is added in translations.ts.
// To add one: add it here, add locales/<code>.ts, numerology.<code>.ts, kundli.<code>.ts, jyotish.<code>.ts, ai.<code>.ts and extra.<code>.ts
// (copies of the English files, translated), and import them in translations.ts.

export type Script = 'latin' | 'devanagari' | 'other';

type Language = {
  code: string;
  nativeName: string;
  englishName: string;
  region: 'india';
  script: Script;
  /** Written right to left (Urdu, Arabic …) */
  rtl?: boolean;
};

export const LANGUAGES = [
  // ---- Languages of India: the 22 official (scheduled) languages, English and 8 more widely spoken ones ----
  { code: 'en', nativeName: 'English', englishName: 'English', region: 'india', script: 'latin' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', region: 'india', script: 'devanagari' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', region: 'india', script: 'other' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', region: 'india', script: 'devanagari' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', region: 'india', script: 'other' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', region: 'india', script: 'other' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', region: 'india', script: 'other' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', region: 'india', script: 'other', rtl: true },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', region: 'india', script: 'other' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia', region: 'india', script: 'other' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', region: 'india', script: 'other' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', region: 'india', script: 'other' },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese', region: 'india', script: 'other' },
  { code: 'mai', nativeName: 'मैथिली', englishName: 'Maithili', region: 'india', script: 'devanagari' },
  { code: 'bho', nativeName: 'भोजपुरी', englishName: 'Bhojpuri', region: 'india', script: 'devanagari' },
  { code: 'raj', nativeName: 'राजस्थानी', englishName: 'Rajasthani', region: 'india', script: 'devanagari' },
  { code: 'hne', nativeName: 'छत्तीसगढ़ी', englishName: 'Chhattisgarhi', region: 'india', script: 'devanagari' },
  { code: 'mag', nativeName: 'मगही', englishName: 'Magahi', region: 'india', script: 'devanagari' },
  { code: 'awa', nativeName: 'अवधी', englishName: 'Awadhi', region: 'india', script: 'devanagari' },
  { code: 'ne', nativeName: 'नेपाली', englishName: 'Nepali', region: 'india', script: 'devanagari' },
  { code: 'kok', nativeName: 'कोंकणी', englishName: 'Konkani', region: 'india', script: 'devanagari' },
  { code: 'sat', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', englishName: 'Santali', region: 'india', script: 'other' },
  { code: 'ks', nativeName: 'کٲشُر', englishName: 'Kashmiri', region: 'india', script: 'other', rtl: true },
  { code: 'sd', nativeName: 'سنڌي', englishName: 'Sindhi', region: 'india', script: 'other', rtl: true },
  { code: 'doi', nativeName: 'डोगरी', englishName: 'Dogri', region: 'india', script: 'devanagari' },
  { code: 'mni', nativeName: 'মৈতৈলোন্', englishName: 'Manipuri', region: 'india', script: 'other' },
  { code: 'brx', nativeName: 'बड़ो', englishName: 'Bodo', region: 'india', script: 'devanagari' },
  { code: 'tcy', nativeName: 'ತುಳು', englishName: 'Tulu', region: 'india', script: 'other' },
  { code: 'sa', nativeName: 'संस्कृतम्', englishName: 'Sanskrit', region: 'india', script: 'devanagari' },
  { code: 'lus', nativeName: 'Mizo ṭawng', englishName: 'Mizo', region: 'india', script: 'latin' },
  { code: 'kha', nativeName: 'Ka Ktien Khasi', englishName: 'Khasi', region: 'india', script: 'latin' },
] as const satisfies readonly Language[];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const languageInfo = (code: string): Language | undefined => LANGUAGES.find((l) => l.code === code);

export const isSupported = (code: string | null | undefined): code is LanguageCode => LANGUAGES.some((l) => l.code === code);

export const isRtl = (code: string) => languageInfo(code)?.rtl === true;

/** Locale used for dates and numbers, e.g. "hi-IN". */
export const dateLocale = (code: string) => (isSupported(code) ? `${code}-IN` : 'en-IN');

/** Picks one of our languages from the phone's settings (e.g. a phone set to Tamil -> "ta"). */
export function fromDeviceLocale(locale: { languageCode?: string | null }): LanguageCode | null {
  const lang = locale.languageCode?.toLowerCase();
  return isSupported(lang) ? lang : null;
}
