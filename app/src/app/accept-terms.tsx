import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConsentForm } from '@/components/ConsentForm';
import { Screen } from '@/components/Screen';
import { spacing } from '@/theme';

/** Shown after sign-in if the server has no (current) consent on record for this account. */
export default function AcceptTermsScreen() {
  const { t } = useTranslation();
  const { acceptTerms, signOut } = useAuth();
  return (
    <Screen>
      <AppText variant="title" style={styles.title}>
        {t('acceptTerms.title')}
      </AppText>
      <AppText variant="caption" style={styles.sub}>
        {t('acceptTerms.body')}
      </AppText>
      <ConsentForm onAccept={acceptTerms} />
      <Button title={t('settings.signOut')} variant="ghost" onPress={signOut} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.lg },
  sub: { marginBottom: spacing.lg },
  signOut: { marginTop: spacing.lg },
});
