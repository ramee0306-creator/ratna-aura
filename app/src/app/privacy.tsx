import { brand } from '@brand';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
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
        <Card style={styles.card}>
          <AppText variant="heading">{t('extra.privacy.aiTitle')}</AppText>
          <AppText>{t('extra.privacy.ai')}</AppText>
        </Card>
        {brand.privacyPolicyUrl ? <Button variant="outline" title={t('extra.privacy.fullPolicy')} onPress={() => Linking.openURL(brand.privacyPolicyUrl)} /> : null}
        {brand.termsUrl ? <Button variant="outline" title={t('extra.privacy.terms')} onPress={() => Linking.openURL(brand.termsUrl)} /> : null}
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
