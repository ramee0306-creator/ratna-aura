import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/theme';

import { NumberBadge } from './NumberBadge';

/** Meaning keys exist for 1–9 and the master numbers 11, 22, 33. */
export const meaningKey = (n: number) => `numerology.meanings.n${[11, 22, 33].includes(n) ? n : ((n - 1) % 9) + 1}`;

/** One number with its name, what it measures, and what it means. */
export function NumberCard({ label, about, value, children }: { label: string; about: string; value: number; children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <NumberBadge value={value} />
        <View style={styles.titles}>
          <AppText variant="overline" style={{ color: colors.emeraldBright }}>
            {label}
          </AppText>
          <AppText variant="heading">{t(`${meaningKey(value)}.title`)}</AppText>
        </View>
      </View>
      <AppText variant="caption">{about}</AppText>
      <AppText>{t(`${meaningKey(value)}.body`)}</AppText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xs },
  titles: { flex: 1, gap: 0 },
});
