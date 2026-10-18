import { brand } from '@brand';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { spacing } from '@/theme';

const SECTIONS = ['collect', 'why', 'protect', 'rights', 'advice'] as const;

export default function PrivacyScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <BackHeader title={t('privacy.title')} />
      <AppText variant="caption" style={styles.updated}>
        {t('privacy.updated')}
      </AppText>
      <View style={styles.list}>
        {SECTIONS.map((key) => (
          <Card key={key} style={styles.card}>
            <AppText variant="heading">{t(`privacy.${key}Title`)}</AppText>
            <AppText>{t(`privacy.${key}`)}</AppText>
          </Card>
        ))}
      </View>
      <AppText variant="caption" style={styles.contact}>
        {t('privacy.contact', { email: brand.supportEmail })}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: { marginTop: -spacing.md, marginBottom: spacing.lg },
  list: { gap: spacing.md },
  card: { gap: spacing.xs },
  contact: { textAlign: 'center', marginTop: spacing.xl },
});
