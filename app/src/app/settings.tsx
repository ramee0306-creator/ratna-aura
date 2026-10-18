import { brand } from '@brand';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { accountLabel, signOut, deleteAccount } = useAuth();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch {
      setError(t('common.tryAgain'));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <BackHeader title={t('settings.title')} />

      <View style={styles.section}>
        <AppText variant="overline">{t('settings.language')}</AppText>
        <LanguagePicker />
      </View>

      <View style={styles.section}>
        <AppText variant="overline">{t('settings.account')}</AppText>
        <Card style={styles.card}>
          {accountLabel ? <AppText>{t('settings.signedInAs', { who: accountLabel })}</AppText> : null}
          <Button title={t('settings.privacy')} variant="outline" onPress={() => router.push('/privacy')} />
          <Button title={t('settings.signOut')} variant="outline" onPress={signOut} />
        </Card>
      </View>

      <View style={styles.section}>
        {!confirmingDelete ? (
          <Button title={t('settings.deleteAccount')} variant="danger" onPress={() => setConfirmingDelete(true)} />
        ) : (
          <Card style={[styles.card, styles.dangerCard]}>
            <AppText variant="bodyStrong" style={{ color: colors.danger }}>
              {t('settings.deleteAccount')}
            </AppText>
            <AppText>{t('settings.deleteWarning')}</AppText>
            {error ? <Notice text={error} /> : null}
            <Button title={t('settings.deleteConfirm')} variant="danger" onPress={onDelete} loading={busy} />
            <Button title={t('common.cancel')} variant="ghost" onPress={() => setConfirmingDelete(false)} disabled={busy} />
          </Card>
        )}
      </View>

      <View style={styles.footer}>
        <AppText variant="caption">{t('settings.publisher', { publisher: brand.publisher })}</AppText>
        <AppText variant="caption">{t('settings.version', { version: Constants.expoConfig?.version ?? '' })}</AppText>
        <AppText variant="caption">{t('settings.credits')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginBottom: spacing.xxl },
  card: { gap: spacing.md },
  dangerCard: { borderColor: colors.danger },
  footer: { alignItems: 'center', gap: 2, marginTop: spacing.lg },
});
