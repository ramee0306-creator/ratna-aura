import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { LanguageGrid } from '@/components/LanguageGrid';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { setLanguage } from '@/i18n';
import { spacing } from '@/theme';

/**
 * "Which language are you comfortable in?" — the very first screen on a new phone,
 * and also reachable from Settings and the welcome screen.
 */
export default function LanguageScreen() {
  const { t } = useTranslation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const first = from === undefined;
  const [restartNeeded, setRestartNeeded] = useState(false);
  const next = () => (first ? router.replace('/welcome') : router.back());

  return (
    <Screen>
      {first ? (
        <View style={styles.brand}>
          <Wordmark height={52} />
        </View>
      ) : (
        <BackHeader title={t('settings.language')} />
      )}
      <View style={styles.head}>
        <AppText variant="title" style={styles.center}>
          {t('language.title')}
        </AppText>
        <AppText variant="caption" style={styles.center}>
          {t('language.subtitle')}
        </AppText>
      </View>
      {restartNeeded ? (
        <View style={styles.restart}>
          <Notice tone="info" text={t('language.restart')} />
          <Button title={t('common.continue')} onPress={next} />
        </View>
      ) : null}
      <LanguageGrid
        onChoose={async (code) => {
          // Right-to-left languages (Urdu, Arabic…) need the app reopened to flip the layout.
          if (await setLanguage(code)) setRestartNeeded(true);
          else next();
        }}
      />
      <AppText variant="caption" style={[styles.center, styles.note]}>
        {t('language.note')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: spacing.lg },
  head: { gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.xl },
  center: { textAlign: 'center' },
  note: { marginTop: spacing.xl },
  restart: { gap: spacing.md, marginBottom: spacing.lg },
});
