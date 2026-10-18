import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export function Notice({ text, tone = 'error' }: { text: string; tone?: 'error' | 'info' | 'success' }) {
  const color = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : colors.goldBright;
  return (
    <View style={[styles.box, { borderColor: color }]} accessibilityLiveRegion="polite">
      <AppText variant="caption" style={{ color }}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginVertical: spacing.sm },
});
