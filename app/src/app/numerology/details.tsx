import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/Screen';
import { DetailsForm } from '@/numerology/DetailsForm';
import { useNumerology } from '@/numerology/NumerologyProvider';
import { colors, spacing } from '@/theme';

export default function NumerologyDetailsScreen() {
  const { t } = useTranslation();
  const { loaded, me, saveMe } = useNumerology();

  return (
    <Screen>
      <BackHeader title={t('numerology.details.title')} />
      {!loaded ? (
        <ActivityIndicator color={colors.gold} />
      ) : (
        <View style={{ gap: spacing.lg }}>
          <AppText variant="caption">{t('numerology.details.intro')}</AppText>
          <DetailsForm
            initial={me}
            onSave={async (details) => {
              await saveMe(details);
              if (router.canGoBack()) router.back();
              else router.replace('/numerology/core');
            }}
          />
        </View>
      )}
    </Screen>
  );
}
