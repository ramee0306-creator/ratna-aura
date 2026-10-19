import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { getCredits, type Wallet } from '@/ai/api';
import { lowestMonthly } from '@/ai/plans';
import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

/** A banner that opens the Premium screen. Hidden while Premium cannot be bought (payments off). */
export function PremiumBanner() {
  const { t } = useTranslation();
  const [state, setState] = useState<{ wallet: Wallet; price: string | null } | null>(null);

  useFocusEffect(
    useCallback(() => {
      getCredits()
        .then((d) => setState(d.mode === 'off' && !d.wallet.premium ? null : { wallet: d.wallet, price: lowestMonthly(d.plans) }))
        .catch(() => setState(null));
    }, []),
  );

  if (!state) return null;
  const active = state.wallet.premium !== null;
  const title = active ? t('extra.premium.bannerActive') : t('extra.premium.banner');
  const hint = active
    ? t('extra.premium.status.leftToday', { count: state.wallet.premiumLeftToday })
    : state.price
      ? t('extra.premium.bannerHint', { price: state.price })
      : t('extra.premium.tagline');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => router.push('/premium')}
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name={active ? 'check-decagram' : 'crown-outline'} size={24} color={colors.backgroundDeep} />
      </View>
      <View style={styles.text}>
        <AppText variant="bodyStrong" style={{ color: colors.goldBright }}>
          {title}
        </AppText>
        <AppText variant="caption">{hint}</AppText>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.goldBright} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceRaised,
  },
  pressed: { opacity: 0.85 },
  icon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
});
