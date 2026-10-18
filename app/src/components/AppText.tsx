import { StyleSheet, Text, type TextProps } from 'react-native';

import { colors, fonts } from '@/theme';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'overline';

const DEVANAGARI = /[ऀ-ॿ]/;

export function AppText({ variant = 'body', style, children, ...rest }: TextProps & { variant?: Variant }) {
  // Hindi text gets its own matching fonts, and no extra letter-spacing
  // (spacing breaks up joined Devanagari letters such as ज्योतिष).
  const devanagari = typeof children === 'string' && DEVANAGARI.test(children);
  return (
    <Text style={[styles.base, styles[variant], devanagari && hindi[variant], style]} {...rest}>
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
