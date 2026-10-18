import { brand } from '@brand';

export const colors = brand.colors;

/**
 * Headings use an elegant serif (Cormorant Garamond for English, Tiro Devanagari for Hindi);
 * everyday text uses clean, easy-to-read Poppins and Hind (both include Devanagari).
 * Loaded in src/app/_layout.tsx.
 */
export const fonts = {
  display: 'CormorantGaramond_700Bold',
  displaySemi: 'CormorantGaramond_600SemiBold',
  displayHindi: 'TiroDevanagariHindi_400Regular',
  heading: 'Poppins_600SemiBold',
  headingMedium: 'Poppins_500Medium',
  body: 'Hind_400Regular',
  bodyMedium: 'Hind_500Medium',
  bodySemiBold: 'Hind_600SemiBold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const MAX_CONTENT_WIDTH = 520;
