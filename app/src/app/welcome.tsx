import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { AVAILABLE_LANGUAGES, isLanguageChosen } from '@/i18n';
import { spacing } from '@/theme';

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  // A new phone first asks which language the person is comfortable in.
  if (!isLanguageChosen()) return <Redirect href="/language" />;
  const current = AVAILABLE_LANGUAGES.find((l) => l.code === i18n.language)?.nativeName ?? 'English';

  return (
    <Screen footer={<Button title={t('welcome.getStarted')} onPress={() => router.push('/consent')} />}>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
        <Wordmark height={62} />
        <AppText variant="caption" style={styles.center}>
          {t('welcome.tagline')}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="title" style={styles.center}>
          {t('welcome.title')}
        </AppText>
        <AppText style={[styles.center, styles.muted]}>{t('welcome.body')}</AppText>
      </View>
      <View style={styles.lang}>
        <AppText variant="label">{t('welcome.languageNow', { language: current })}</AppText>
        <Button
          variant="outline"
          title={t('welcome.change')}
          onPress={() => router.push({ pathname: '/language', params: { from: 'welcome' } })}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl },
  logo: { width: 140, height: 140, marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  muted: { opacity: 0.85 },
  body: { gap: spacing.md, marginTop: spacing.xxl },
  lang: { gap: spacing.sm, alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.lg },
});
