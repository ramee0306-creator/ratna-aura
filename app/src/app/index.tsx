import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Wordmark } from '@/components/Wordmark';
import { colors, radius, spacing } from '@/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Feature = { key: string; icon: IconName };

// Each tile becomes a real screen in a later milestone.
const ASTROLOGY: Feature[] = [
  { key: 'kundli', icon: 'star-four-points-outline' },
  { key: 'rashifal', icon: 'zodiac-leo' },
  { key: 'panchang', icon: 'weather-sunset' },
  { key: 'matching', icon: 'hand-heart-outline' },
];
const NUMEROLOGY: Feature[] = [
  { key: 'coreNumbers', icon: 'numeric-9-circle-outline' },
  { key: 'loShu', icon: 'grid' },
  { key: 'nameCorrection', icon: 'format-letter-case' },
  { key: 'mobileNumber', icon: 'cellphone' },
  { key: 'compatibility', icon: 'cards-heart-outline' },
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

function Tile({ feature, accent }: { feature: Feature; accent: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${t(`home.${feature.key}`)}, ${t('common.comingSoon')}`}>
      <View style={styles.tileTop}>
        <MaterialCommunityIcons name={feature.icon} size={26} color={accent} />
        <AppText style={styles.soon}>{t('common.comingSoon')}</AppText>
      </View>
      <AppText variant="bodyStrong">{t(`home.${feature.key}`)}</AppText>
      <AppText variant="caption" numberOfLines={2}>
        {t(`home.${feature.key}Hint`)}
      </AppText>
    </View>
  );
}

function BigCard({ icon, title, hint }: { icon: IconName; title: string; hint: string }) {
  const { t } = useTranslation();
  return (
    <Card style={styles.bigCard}>
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
      <AppText style={styles.soon}>{t('common.comingSoon')}</AppText>
    </Card>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const name = profile?.display_name;

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
          <Tile key={f.key} feature={f} accent={colors.gold} />
        ))}
      </View>

      <SectionTitle title={t('home.numerology')} accent={colors.emeraldBright} />
      <View style={styles.grid}>
        {NUMEROLOGY.map((f) => (
          <Tile key={f.key} feature={f} accent={colors.emeraldBright} />
        ))}
      </View>

      <View style={styles.bigCards}>
        <BigCard icon="chat-processing-outline" title={t('home.askAi')} hint={t('home.askAiHint')} />
        <BigCard icon="account-voice" title={t('home.talk')} hint={t('home.talkHint')} />
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
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
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
