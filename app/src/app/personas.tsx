import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { PersonaAvatar } from '@/ai/PersonaAvatar';
import { PERSONAS } from '@/ai/personas';
import { AIBadge } from '@/components/AIBadge';
import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Screen } from '@/components/Screen';
import { colors, radius, spacing } from '@/theme';

export default function PersonasScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <BackHeader title={t('extra.personas.title')} />
      <View style={styles.gap}>
        <AppText variant="caption">{t('extra.personas.intro')}</AppText>
        {PERSONAS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`${p.name}, ${t(`extra.personas.about.${p.id}.role`)}`}
            onPress={() => router.push({ pathname: '/persona/[id]', params: { id: p.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <PersonaAvatar persona={p} />
            <View style={styles.flex}>
              <View style={styles.nameRow}>
                <AppText variant="bodyStrong">{p.name}</AppText>
                <AIBadge />
              </View>
              <AppText variant="label" style={{ color: p.color }}>
                {t(`extra.personas.about.${p.id}.role`)}
              </AppText>
              <AppText variant="caption">{t(`extra.personas.about.${p.id}.text`)}</AppText>
              <AppText variant="caption" style={{ color: colors.textFaint }}>
                {t(p.billing === 'message' ? 'extra.personas.perMessage' : 'extra.personas.perMinute', { count: p.price })}
              </AppText>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textFaint} />
          </Pressable>
        ))}
        <AppText variant="caption" style={styles.center}>
          {t('extra.personas.noFree')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  center: { textAlign: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  pressed: { opacity: 0.8 },
});
