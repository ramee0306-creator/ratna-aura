import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { DemoAccountChooser } from '@/auth/DemoAccountChooser';
import { normalizeIndianMobile } from '@/auth/phone';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { isDemoMode, isSupabaseConfigured } from '@/lib/supabase';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { sendOtp, signInWithGoogle } = useAuth();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState<'otp' | 'google' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [choosingAccount, setChoosingAccount] = useState(false);
  const serverReady = isSupabaseConfigured || isDemoMode;

  async function onSendOtp() {
    const e164 = normalizeIndianMobile(phone);
    if (!e164) {
      setError(t('login.invalidPhone'));
      return;
    }
    setBusy('otp');
    setError(null);
    try {
      await sendOtp(e164);
      router.push({ pathname: '/verify', params: { phone: e164 } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.tryAgain'));
    } finally {
      setBusy(null);
    }
  }

  async function onGoogle(demoAccount?: string) {
    // Demo mode has no Google: show a stand-in for Google's account chooser first.
    if (isDemoMode && !demoAccount) {
      setChoosingAccount(true);
      return;
    }
    setChoosingAccount(false);
    setBusy('google');
    setError(null);
    try {
      const result = await signInWithGoogle(demoAccount);
      if (result === 'cancelled') setError(t('login.googleCancelled'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.tryAgain'));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen>
      <BackHeader title={t('login.title')} />
      <AppText variant="caption" style={styles.sub}>
        {t('login.subtitle')}
      </AppText>
      {!serverReady ? <Notice tone="info" text={t('login.notConfigured')} /> : null}

      <View style={styles.form}>
        <TextField
          label={t('login.phoneLabel')}
          placeholder={t('login.phonePlaceholder')}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={16}
          value={phone}
          onChangeText={setPhone}
          onSubmitEditing={onSendOtp}
          prefix={<AppText variant="bodyStrong" style={styles.prefix}>+91</AppText>}
        />
        {error ? <Notice text={error} /> : null}
        <Button title={t('login.sendOtp')} onPress={onSendOtp} loading={busy === 'otp'} disabled={!serverReady || !!busy} />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <AppText variant="caption">{t('login.or')}</AppText>
        <View style={styles.divider} />
      </View>

      <Button
        title={t('login.google')}
        variant="outline"
        onPress={() => onGoogle()}
        loading={busy === 'google'}
        disabled={!serverReady || !!busy}
        icon={<MaterialCommunityIcons name="google" size={20} color={colors.goldBright} />}
      />
      {isDemoMode ? (
        <DemoAccountChooser
          visible={choosingAccount}
          onChoose={(email) => onGoogle(email)}
          onCancel={() => {
            setChoosingAccount(false);
            setError(t('login.googleCancelled'));
          }}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: -spacing.md, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
  prefix: { color: colors.textMuted },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.xl },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
});
