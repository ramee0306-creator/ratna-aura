import { StyleSheet, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

import { AppText } from './AppText';

/** Shown wherever an AI answers, so nobody mistakes it for a human. */
export function AIBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="AI">
      <AppText style={styles.text}>AI</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldBright,
    paddingHorizontal: 8,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: fonts.heading, fontSize: 11, lineHeight: 16, color: colors.goldBright, letterSpacing: 1 },
});
