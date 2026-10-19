import { brand } from '@brand';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { AVAILABLE_LANGUAGES, dateLocale } from '@/i18n';
import { DEFAULT_REMINDER, getReminder, type Reminder, remindersSupported, setReminder } from '@/notifications/reminders';
import { colors, spacing } from '@/theme';

function ReminderCard() {
  const { t, i18n } = useTranslation();
  const [reminder, setLocal] = useState<Reminder>(DEFAULT_REMINDER);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    getReminder().then(setLocal);
  }, []);

  async function update(next: Reminder) {
    setLocal(next);
    setDenied(false);
    const ok = await setReminder(next, {
      title: t('extra.reminder.notificationTitle'),
      body: t('extra.reminder.notificationBody'),
      channel: t('extra.reminder.channel'),
    }).catch(() => false);
    if (!ok && next.enabled) {
      setDenied(true);
      setLocal({ ...next, enabled: false });
    }
  }

  const shift = (minutes: number) => {
    const total = (reminder.hour * 60 + reminder.minute + minutes + 24 * 60) % (24 * 60);
    update({ ...reminder, hour: Math.floor(total / 60), minute: total % 60 });
  };
  const time = new Intl.DateTimeFormat(dateLocale(i18n.language), { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(
    Date.UTC(2000, 0, 1, reminder.hour, reminder.minute),
  );

  return (
    <View style={styles.section}>
      <AppText variant="overline">{t('extra.reminder.title')}</AppText>
      <Card style={styles.card}>
        {!remindersSupported ? (
          <AppText variant="caption">{t('extra.reminder.webOnly')}</AppText>
        ) : (
          <>
            <View style={styles.switchRow}>
              <AppText style={styles.flex}>{t('extra.reminder.toggle')}</AppText>
              <Switch
                value={reminder.enabled}
                onValueChange={(enabled) => update({ ...reminder, enabled })}
                trackColor={{ true: colors.gold, false: colors.border }}
                accessibilityLabel={t('extra.reminder.toggle')}
              />
            </View>
            {reminder.enabled ? (
              <View style={styles.switchRow}>
                <AppText variant="caption" style={styles.flex}>
                  {t('extra.reminder.time', { time })}
                </AppText>
                <Pressable accessibilityRole="button" onPress={() => shift(-30)} hitSlop={8}>
                  <AppText variant="label" style={{ color: colors.gold }}>
                    {t('extra.reminder.earlier')}
                  </AppText>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => shift(30)} hitSlop={8}>
                  <AppText variant="label" style={{ color: colors.gold }}>
                    {t('extra.reminder.later')}
                  </AppText>
                </Pressable>
              </View>
            ) : null}
            {denied ? <Notice tone="info" text={t('extra.reminder.denied')} /> : null}
          </>
        )}
      </Card>
    </View>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { accountLabel, signOut, deleteAccount, profile } = useAuth();
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
        <Card style={styles.card}>
          <AppText variant="bodyStrong">{AVAILABLE_LANGUAGES.find((l) => l.code === i18n.language)?.nativeName ?? 'English'}</AppText>
          <Button
            title={t('welcome.change')}
            variant="outline"
            onPress={() => router.push({ pathname: '/language', params: { from: 'settings' } })}
          />
        </Card>
      </View>

      <ReminderCard />

      <View style={styles.section}>
        <AppText variant="overline">{t('settings.account')}</AppText>
        <Card style={styles.card}>
          {accountLabel ? <AppText>{t('settings.signedInAs', { who: accountLabel })}</AppText> : null}
          <Button title={t('extra.premium.title')} variant="outline" onPress={() => router.push('/premium')} />
          <Button title={t('settings.privacy')} variant="outline" onPress={() => router.push('/privacy')} />
          <Button title={t('settings.signOut')} variant="outline" onPress={signOut} />
          {profile?.is_admin ? <Button title="Admin panel" variant="outline" onPress={() => router.push('/admin')} /> : null}
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
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
});
