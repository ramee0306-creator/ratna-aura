import type { Harmony } from '@ratna/numerology';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

export const HARMONY_COLOR: Record<Harmony, string> = {
  supportive: colors.emeraldBright,
  neutral: colors.goldBright,
  challenging: colors.danger,
};

export function HarmonyPill({ harmony }: { harmony: Harmony }) {
  const { t } = useTranslation();
  const color = HARMONY_COLOR[harmony];
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <AppText variant="label" style={{ color }}>
        {t(`numerology.harmony.${harmony}`)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
