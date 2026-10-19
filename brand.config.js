// @ts-check
/**
 * ============================================================
 *  BRAND SETTINGS — the ONE place to rename / re-colour the app
 * ============================================================
 *
 * Change the values below, then run `npm run make-icons` and rebuild.
 *
 * ⚠️  androidPackage: this can NEVER be changed after the first
 *     upload to Google Play. Confirm it before Milestone 9.
 */
const brand = /** @type {const} */ ({
  /** Name shown under the app icon and on the store listing */
  appName: 'Ratna Aura',
  /** The same name written in Hindi (Devanagari) */
  appNameHi: 'रत्न ऑरा',
  /**
   * The logo is the name in two parts: the first in gold, the second in emerald.
   * Change both words here if the name changes.
   */
  logo: { first: 'Ratna', second: 'Aura' },
  /** Short line under the logo */
  tagline: {
    en: 'Astrology & numerology, beautifully guided',
    hi: 'ज्योतिष और अंक ज्योतिष, सुंदर मार्गदर्शन',
  },
  /** Company name shown in Settings and on the store */
  publisher: 'Raksha',
  /** Lower-case id used for the Expo project, links and file names */
  slug: 'ratna-aura',
  /** Deep-link prefix, e.g. ratnaaura://auth/callback */
  scheme: 'ratnaaura',
  /** Google Play package ID (permanent after first upload!) */
  androidPackage: 'com.velqorastudios.ratnaaura',
  /** Apple bundle ID (for a future iOS version) */
  iosBundleId: 'com.velqorastudios.ratnaaura',
  /** Support e-mail shown in the privacy policy and store listing */
  supportEmail: 'velqorasupport99@gmail.com',
  /** Users must be at least this old */
  minimumAge: 18,

  /**
   * Colours: jewel tones — sapphire night sky, gold and emerald.
   * Gold is the main accent; emerald is the second accent (logo "Aura", success, numerology).
   */
  colors: {
    background: '#0B0C2C', // main sapphire-indigo night sky
    backgroundDeep: '#05061A', // darkest edge of the sky gradient
    backgroundGlow: '#1D1A57', // soft violet glow at the top
    surface: '#141543', // cards
    surfaceRaised: '#1C1D57', // pressed / highlighted cards
    border: '#2F2E72', // thin card outlines
    gold: '#D8B25A', // main accent
    goldBright: '#F3DB97', // highlights, active text
    goldDeep: '#A47E2F', // gold shadows / pressed buttons
    emerald: '#2EAD72', // second accent
    emeraldBright: '#6EDCA8', // emerald highlights
    emeraldDeep: '#17714A', // emerald shadows
    text: '#F6F2E7', // main text (warm ivory)
    textMuted: '#B6B3D6', // secondary text
    textFaint: '#7E7AA9', // hints, captions
    star: '#FFF6D8', // tiny stars in the background
    danger: '#F08A8A',
    success: '#6EDCA8',
  },
});

module.exports = { brand };
