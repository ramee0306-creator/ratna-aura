import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { formatIndianMobile, isSixDigitCode } from '@/auth/phone';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { isDemoMode } from '@/lib/supabase';
import { spacing } from '@/theme';

export default function VerifyScreen() {
  const { t } = useTranslation();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, sendOtp } = useAuth();
  // Demo mode sends no SMS: the code is filled in so the demo can be tried straight away.
  const [code, setCode] = useState(isDemoMode ? '123456' : '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);

  async function onVerify() {
    if (!isSixDigitCode(code)) {
      setMessage({ text: t('verify.invalidCode'), tone: 'error' });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      // On success the app moves to the home screen automatically.
      await verifyOtp(phone, code);
    } catch {
      setMessage({ text: t('verify.wrongCode'), tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setMessage(null);
    try {
      await sendOtp(phone);
      setMessage({ text: t('verify.resent'), tone: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : t('common.tryAgain'), tone: 'error' });
    }
  }

  return (
    <Screen>
      <BackHeader title={t('verify.title')} />
      <AppText variant="caption" style={styles.sub}>
        {t('verify.sentTo', { phone: formatIndianMobile(phone) })}
      </AppText>
      <View style={styles.form}>
        <TextField
          label={t('verify.codeLabel')}
          placeholder="••••••"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
          onSubmitEditing={onVerify}
          autoFocus
        />
        {message ? <Notice text={message.text} tone={message.tone} /> : null}
        <Button title={t('verify.verify')} onPress={onVerify} loading={busy} />
        <Button title={t('verify.resend')} variant="ghost" onPress={onResend} disabled={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: { marginTop: -spacing.md, marginBottom: spacing.lg },
  form: { gap: spacing.lg },
});
