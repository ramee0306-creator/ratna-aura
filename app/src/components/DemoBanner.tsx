import { StyleSheet, View } from 'react-native';

import { showDemoNotices } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

export function DemoBanner() {
  if (!showDemoNotices) return null;
  return (
    <View style={styles.banner}>
      <AppText variant="caption" style={styles.text}>
        DEMO MODE · not connected to a server · any OTP works
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.goldDeep, paddingVertical: spacing.xs, alignItems: 'center' },
  text: { color: colors.backgroundDeep, fontSize: 12 },
});
