import type { ReactNode } from 'react';
import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'overline';

const DEVANAGARI = /[ऀ-ॿ]/; // Hindi, Marathi
const OTHER_INDIC = /[ঀ-ൿ]/; // Bengali, Assamese, Gurmukhi, Gujarati, Odia, Tamil, Telugu, Kannada, Malayalam

/** The plain text inside children such as "a", 3 or ["a", " · ", "b"]. */
function textOf(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textOf).join('');
  return '';
}

/**
 * Text in the app's fonts. Indian scripts get matching fonts and no extra letter-spacing
 * (spacing breaks up joined letters such as ज्योतिष). Devanagari uses the bundled Hind / Tiro
 * Devanagari fonts; other Indian scripts use the phone's own fonts (Noto on Android), which
 * cover them beautifully without making the app bigger.
 */
export function AppText({ variant = 'body', style, children, ...rest }: TextProps & { variant?: Variant }) {
  const text = textOf(children);
  const script = DEVANAGARI.test(text) ? hindi : OTHER_INDIC.test(text) ? indic : null;
  return (
    <Text style={[styles.base, styles[variant], script?.[variant], style]} {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: { color: colors.text },
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 48, color: colors.goldBright },
  title: { fontFamily: fonts.display, fontSize: 31, lineHeight: 38 },
  heading: { fontFamily: fonts.display, fontSize: 23, lineHeight: 29 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, color: colors.text },
  bodyStrong: { fontFamily: fonts.bodySemiBold, fontSize: 16, lineHeight: 25 },
  caption: { fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.textMuted },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20, color: colors.textMuted },
  overline: {
    fontFamily: fonts.headingMedium,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.gold,
  },
});

const hindi: Partial<Record<Variant, object>> = StyleSheet.create({
  display: { fontFamily: fonts.displayHindi, fontSize: 32, lineHeight: 52 },
  title: { fontFamily: fonts.displayHindi, fontSize: 26, lineHeight: 42 },
  heading: { fontFamily: fonts.displayHindi, fontSize: 20, lineHeight: 34 },
  overline: { letterSpacing: 0, fontSize: 14 },
});

const SYSTEM = Platform.select({ android: 'sans-serif', ios: 'System', default: 'system-ui, sans-serif' });

const indic: Partial<Record<Variant, object>> = StyleSheet.create({
  display: { fontFamily: SYSTEM, fontWeight: '600', fontSize: 28, lineHeight: 46 },
  title: { fontFamily: SYSTEM, fontWeight: '600', fontSize: 24, lineHeight: 40 },
  heading: { fontFamily: SYSTEM, fontWeight: '600', fontSize: 19, lineHeight: 32 },
  body: { fontFamily: SYSTEM, fontWeight: '400', fontSize: 16, lineHeight: 27 },
  bodyStrong: { fontFamily: SYSTEM, fontWeight: '600', fontSize: 16, lineHeight: 27 },
  caption: { fontFamily: SYSTEM, fontWeight: '400', fontSize: 13.5, lineHeight: 22 },
  label: { fontFamily: SYSTEM, fontWeight: '500', fontSize: 14, lineHeight: 22 },
  overline: { fontFamily: SYSTEM, fontWeight: '500', fontSize: 13.5, lineHeight: 22, letterSpacing: 0 },
});
