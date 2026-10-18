import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { AppText } from './AppText';

export function BackHeader({ title }: { title: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={12}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      >
        <MaterialCommunityIcons name="chevron-left" size={30} color={colors.goldBright} />
      </Pressable>
      <AppText variant="title" style={styles.title}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl, marginLeft: -6 },
  title: { flex: 1 },
});
