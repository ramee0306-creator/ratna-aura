import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { type Href, router, useFocusEffect } from 'expo-router';
import { type ComponentProps, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { PremiumBanner } from '@/ai/PremiumBanner';
import { useAuth } from '@/auth/AuthProvider';
import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { type Feature as PaidFeature, getPrices, type Prices } from '@/paid/api';
import { colors, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Feature = { key: string; icon: IconName; href?: Href; title?: string; hint?: string; paid?: PaidFeature };

// Tiles without a screen yet would show "Soon".
const ASTROLOGY: Feature[] = [
  { key: 'kundli', icon: 'star-four-points-outline', href: '/kundli', paid: 'kundli' },
  { key: 'rashifal', icon: 'zodiac-leo', href: '/rashifal', hint: 'jyotish.rashifal.homeHint', paid: 'rashifal' },
  { key: 'panchang', icon: 'weather-sunset', href: '/panchang', paid: 'panchang' },
  { key: 'matching', icon: 'hand-heart-outline', href: '/milan', paid: 'milan' },
  { key: 'palm', icon: 'hand-back-right-outline', href: '/palm', title: 'extra.palm.title', hint: 'extra.palm.homeHint', paid: 'palm' },
];
const NUMEROLOGY: Feature[] = [
  { key: 'coreNumbers', icon: 'numeric-9-circle-outline', href: '/numerology/core', paid: 'numbers' },
  { key: 'loShu', icon: 'grid', href: '/numerology/lo-shu', paid: 'loshu' },
  { key: 'nameCorrection', icon: 'format-letter-case', href: '/numerology/name-correction', paid: 'name' },
  { key: 'mobileNumber', icon: 'cellphone', href: '/numerology/vibrations', paid: 'vibrations' },
  { key: 'compatibility', icon: 'cards-heart-outline', href: '/numerology/compatibility', paid: 'compatibility' },
];

// Astrology is marked in gold, numerology in emerald, so the two halves are easy to tell apart.
function SectionTitle({ title, accent }: { title: string; accent: string }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.rule} />
      <AppText variant="overline" style={{ color: accent }}>
        {title}
      </AppText>
      <View style={styles.rule} />
    </View>
  );
}

function Tile({ feature, accent, prices }: { feature: Feature; accent: string; prices: Prices | null }) {
  const { t } = useTranslation();
  const ready = feature.href !== undefined;
  const title = t(feature.title ?? `home.${feature.key}`);
  const price = feature.paid ? prices?.[feature.paid] : undefined;
  const content = (
    <>
      <View style={styles.tileTop}>
        <MaterialCommunityIcons name={feature.icon} size={26} color={accent} />
        {ready ? (
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textFaint} />
        ) : (
          <AppText style={styles.soon}>{t('common.comingSoon')}</AppText>
        )}
      </View>
      <AppText variant="bodyStrong">{title}</AppText>
      <AppText variant="caption" numberOfLines={2}>
        {t(feature.hint ?? `home.${feature.key}Hint`)}
      </AppText>
      {price ? (
        <AppText style={[styles.price, { color: accent, borderColor: accent + '66' }]}>{t('extra.paid.price', { count: price })}</AppText>
      ) : null}
    </>
  );
  if (!ready) {
    return (
      <View style={styles.tile} accessible accessibilityLabel={`${title}, ${t('common.comingSoon')}`}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => router.push(feature.href!)}
      style={({ pressed }) => [styles.tile, { borderColor: accent + '66' }, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

function BigCard({ icon, title, hint, href }: { icon: IconName; title: string; hint: string; href?: Href }) {
  const { t } = useTranslation();
  const content = (
    <>
      <View style={styles.bigIcon}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.backgroundDeep} />
      </View>
      <View style={styles.bigText}>
        <View style={styles.bigTitleRow}>
          <AppText variant="heading">{title}</AppText>
          <AIBadge />
        </View>
        <AppText variant="caption">{hint}</AppText>
      </View>
      {href ? (
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.goldBright} />
      ) : (
        <AppText style={styles.soon}>{t('common.comingSoon')}</AppText>
      )}
    </>
  );
  if (!href) return <Card style={styles.bigCard}>{content}</Card>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.push(href)} style={({ pressed }) => pressed && styles.pressed}>
      <Card style={styles.bigCard}>{content}</Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const name = profile?.display_name;
  // Prices on the tiles, so it is clear before opening a tool what it costs.
  const [prices, setPrices] = useState<Prices | null>(null);
  useFocusEffect(
    useCallback(() => {
      getPrices()
        .then((p) => setPrices(p.prices))
        .catch(() => undefined);
    }, []),
  );

  return (
    <Screen>
      <View style={styles.brandRow}>
        <Wordmark height={34} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          hitSlop={12}
          onPress={() => router.push('/settings')}
          style={styles.settings}
        >
          <MaterialCommunityIcons name="cog-outline" size={26} color={colors.goldBright} />
        </Pressable>
      </View>
      <View style={styles.greeting}>
        <AppText variant="title">{name ? t('home.greetingName', { name }) : t('home.greeting')}</AppText>
        <AppText variant="caption">{t('home.subtitle')}</AppText>
      </View>

      <SectionTitle title={t('home.astrology')} accent={colors.gold} />
      <View style={styles.grid}>
        {ASTROLOGY.map((f) => (
          <Tile key={f.key} feature={f} accent={colors.gold} prices={prices} />
        ))}
      </View>

      <SectionTitle title={t('home.numerology')} accent={colors.emeraldBright} />
      <View style={styles.grid}>
        {NUMEROLOGY.map((f) => (
          <Tile key={f.key} feature={f} accent={colors.emeraldBright} prices={prices} />
        ))}
      </View>

      <View style={styles.bigCards}>
        <BigCard icon="chat-processing-outline" title={t('home.askAi')} hint={t('home.askAiHint')} href="/ask" />
        <BigCard icon="account-voice" title={t('home.talk')} hint={t('home.talkHint')} href="/personas" />
        <PremiumBanner />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: -6 },
  greeting: { gap: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  settings: { padding: spacing.xs },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  rule: { flex: 1, height: 1, backgroundColor: colors.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: 2,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  price: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  soon: {
    fontSize: 11,
    lineHeight: 16,
    color: colors.textFaint,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  bigCards: { gap: spacing.md, marginTop: spacing.xxl },
  bigCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderColor: colors.goldDeep },
  bigIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigText: { flex: 1, gap: 2 },
  bigTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
});
