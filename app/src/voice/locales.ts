// Which speech language to use for each app language. Phones have voices for the big Indian languages;
// for others we use the closest language that is written the same way (or none, if no voice fits).

const SPEECH: Record<string, string | null> = {
  en: 'en-IN',
  hi: 'hi-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  ur: 'ur-IN',
  kn: 'kn-IN',
  or: 'or-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  as: 'as-IN',
  ne: 'ne-NP',
  // Written in Devanagari and close to Hindi: a Hindi voice reads them well enough.
  mai: 'hi-IN',
  bho: 'hi-IN',
  raj: 'hi-IN',
  hne: 'hi-IN',
  mag: 'hi-IN',
  awa: 'hi-IN',
  doi: 'hi-IN',
  brx: 'hi-IN',
  kok: 'hi-IN',
  sa: 'hi-IN',
  // Same scripts as Kannada / Bengali / Urdu.
  tcy: 'kn-IN',
  mni: 'bn-IN',
  ks: 'ur-IN',
  sd: 'ur-IN',
  // Latin-script languages of the North-East: an Indian English voice.
  lus: 'en-IN',
  kha: 'en-IN',
  // Ol Chiki script: no phone voice reads it.
  sat: null,
};

/** BCP-47 language for speaking and listening, or null if speech is not available for this language. */
export const speechLocale = (code: string): string | null => (code in SPEECH ? SPEECH[code] : 'en-IN');

export const SPEECH_LANGUAGES = Object.keys(SPEECH);
