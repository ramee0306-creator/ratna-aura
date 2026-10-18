import { type CalendarDate, parseIsoDate } from '@ratna/numerology';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/theme';

import { DetailsForm } from './DetailsForm';
import { isoToDisplay, type PersonDetails } from './details';
import { useNumerology } from './NumerologyProvider';

/**
 * Shows the numerology screen once your name and date of birth are known;
 * until then shows the short form to enter them.
 */
export function RequireDetails({ children }: { children: (me: PersonDetails, birth: CalendarDate) => ReactNode }) {
  const { t } = useTranslation();
  const { loaded, me, saveMe } = useNumerology();
  const birth = me ? parseIsoDate(me.birthDate) : null;

  if (!loaded) return <ActivityIndicator color={colors.gold} style={styles.loading} />;

  if (!me || !birth) {
    return (
      <View style={styles.gap}>
        <AppText variant="heading">{t('numerology.details.title')}</AppText>
        <AppText variant="caption">{t('numerology.details.intro')}</AppText>
        <DetailsForm onSave={saveMe} />
      </View>
    );
  }

  return (
    <View style={styles.gap}>
      <Card style={styles.person}>
        <View style={styles.personText}>
          <AppText variant="bodyStrong">{me.fullName}</AppText>
          <AppText variant="caption">{t('numerology.details.born', { date: isoToDisplay(me.birthDate) })}</AppText>
        </View>
        <Button title={t('numerology.details.edit')} variant="ghost" onPress={() => router.push('/numerology/details')} />
      </Card>
      {children(me, birth)}
      <AppText variant="caption" style={styles.center}>
        {t('numerology.guidance')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  gap: { gap: spacing.lg },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  personText: { flex: 1 },
  center: { textAlign: 'center', marginTop: spacing.md },
});
