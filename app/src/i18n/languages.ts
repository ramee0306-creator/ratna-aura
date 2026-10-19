// Every language the app offers, in the order shown on the language screen.
// A language appears in the app as soon as its translation is added in translations.ts.
// To add one: add it here, add locales/<code>.ts, numerology.<code>.ts and kundli.<code>.ts
// (copies of the English files, translated), and import them in translations.ts.

export type Script = 'latin' | 'devanagari' | 'other';

type Language = {
  code: string;
  nativeName: string;
  englishName: string;
  region: 'india' | 'world';
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

  // ---- World languages ----
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', region: 'world', script: 'latin' },
  { code: 'zh', nativeName: '简体中文', englishName: 'Chinese (Simplified)', region: 'world', script: 'other' },
  { code: 'zh-TW', nativeName: '繁體中文', englishName: 'Chinese (Traditional)', region: 'world', script: 'other' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', region: 'world', script: 'other', rtl: true },
  { code: 'fr', nativeName: 'Français', englishName: 'French', region: 'world', script: 'latin' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', region: 'world', script: 'latin' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian', region: 'world', script: 'other' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', region: 'world', script: 'latin' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', region: 'world', script: 'latin' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', region: 'world', script: 'other' },
  { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili', region: 'world', script: 'latin' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', region: 'world', script: 'latin' },
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', region: 'world', script: 'other' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', region: 'world', script: 'latin' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', region: 'world', script: 'other', rtl: true },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian', region: 'world', script: 'latin' },
  { code: 'th', nativeName: 'ไทย', englishName: 'Thai', region: 'world', script: 'other' },
  { code: 'fil', nativeName: 'Filipino', englishName: 'Filipino', region: 'world', script: 'latin' },
  { code: 'ms', nativeName: 'Bahasa Melayu', englishName: 'Malay', region: 'world', script: 'latin' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish', region: 'world', script: 'latin' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian', region: 'world', script: 'other' },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch', region: 'world', script: 'latin' },
  { code: 'si', nativeName: 'සිංහල', englishName: 'Sinhala', region: 'world', script: 'other' },
  { code: 'my', nativeName: 'မြန်မာ', englishName: 'Burmese', region: 'world', script: 'other' },
  { code: 'km', nativeName: 'ខ្មែរ', englishName: 'Khmer', region: 'world', script: 'other' },
  { code: 'ps', nativeName: 'پښتو', englishName: 'Pashto', region: 'world', script: 'other', rtl: true },
  { code: 'am', nativeName: 'አማርኛ', englishName: 'Amharic', region: 'world', script: 'other' },
  { code: 'ha', nativeName: 'Hausa', englishName: 'Hausa', region: 'world', script: 'latin' },
  { code: 'yo', nativeName: 'Yorùbá', englishName: 'Yoruba', region: 'world', script: 'latin' },
  { code: 'zu', nativeName: 'isiZulu', englishName: 'Zulu', region: 'world', script: 'latin' },
  { code: 'ro', nativeName: 'Română', englishName: 'Romanian', region: 'world', script: 'latin' },
  { code: 'el', nativeName: 'Ελληνικά', englishName: 'Greek', region: 'world', script: 'other' },
  { code: 'he', nativeName: 'עברית', englishName: 'Hebrew', region: 'world', script: 'other', rtl: true },
  { code: 'cs', nativeName: 'Čeština', englishName: 'Czech', region: 'world', script: 'latin' },
  { code: 'hu', nativeName: 'Magyar', englishName: 'Hungarian', region: 'world', script: 'latin' },
  { code: 'sv', nativeName: 'Svenska', englishName: 'Swedish', region: 'world', script: 'latin' },
  { code: 'bg', nativeName: 'Български', englishName: 'Bulgarian', region: 'world', script: 'other' },
  { code: 'da', nativeName: 'Dansk', englishName: 'Danish', region: 'world', script: 'latin' },
  { code: 'fi', nativeName: 'Suomi', englishName: 'Finnish', region: 'world', script: 'latin' },
  { code: 'nb', nativeName: 'Norsk', englishName: 'Norwegian', region: 'world', script: 'latin' },
] as const satisfies readonly Language[];

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const languageInfo = (code: string): Language | undefined => LANGUAGES.find((l) => l.code === code);

export const isSupported = (code: string | null | undefined): code is LanguageCode => LANGUAGES.some((l) => l.code === code);

export const isRtl = (code: string) => languageInfo(code)?.rtl === true;

/** Locale used for dates and numbers, e.g. "hi-IN" for Indian languages, "fr" for French. */
export function dateLocale(code: string): string {
  const info = languageInfo(code);
  if (!info) return 'en-IN';
  return info.region === 'india' ? `${code}-IN` : code;
}

/** Picks one of our languages from the phone's settings, e.g. Chinese in Taiwan -> "zh-TW". */
export function fromDeviceLocale(locale: { languageCode?: string | null; regionCode?: string | null; languageTag?: string }): LanguageCode | null {
  const lang = locale.languageCode?.toLowerCase();
  if (!lang) return null;
  if (lang === 'zh') {
    const traditional = /Hant/.test(locale.languageTag ?? '') || ['TW', 'HK', 'MO'].includes(locale.regionCode ?? '');
    return traditional ? 'zh-TW' : 'zh';
  }
  if (lang === 'no' || lang === 'nn') return 'nb';
  if (lang === 'tl') return 'fil';
  if (lang === 'iw') return 'he';
  if (lang === 'in') return 'id';
  return isSupported(lang) ? lang : null;
}
