import { brand } from '@brand';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { spacing } from '@/theme';

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const tagline = i18n.language === 'hi' ? brand.tagline.hi : brand.tagline.en;

  return (
    <Screen footer={<Button title={t('welcome.getStarted')} onPress={() => router.push('/consent')} />}>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/splash-icon.png')} style={styles.logo} contentFit="contain" />
        <Wordmark height={62} />
        <AppText variant="caption" style={styles.center}>
          {tagline}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="title" style={styles.center}>
          {t('welcome.title')}
        </AppText>
        <AppText style={[styles.center, styles.muted]}>{t('welcome.body')}</AppText>
      </View>
      <View style={styles.lang}>
        <AppText variant="overline">{t('welcome.chooseLanguage')}</AppText>
        <LanguagePicker />
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
  lang: { gap: spacing.md, alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.lg },
});
