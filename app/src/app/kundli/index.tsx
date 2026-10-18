import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BackHeader } from '@/components/BackHeader';
import { Button } from '@/components/Button';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { type BirthProfile, listProfiles } from '@/kundli/api';
import { isoToDisplay } from '@/numerology/details';
import { colors, radius, spacing } from '@/theme';

export default function KundliListScreen() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<BirthProfile[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    listProfiles()
      .then(setProfiles)
      .catch(() => setFailed(true));
  }, []);

  // Reload whenever the screen comes back into view (after adding or deleting someone).
  useFocusEffect(load);

  return (
    <Screen>
      <BackHeader title={t('kundli.title')} />
      <AppText variant="caption" style={styles.intro}>
        {t('kundli.intro')}
      </AppText>

      {failed ? (
        <View style={styles.gap}>
          <Notice text={t('kundli.loadFailed')} />
          <Button variant="outline" title={t('kundli.retry')} onPress={load} />
        </View>
      ) : profiles === null ? (
        <ActivityIndicator color={colors.gold} style={styles.loading} />
      ) : (
        <View style={styles.gap}>
          {profiles.length === 0 ? (
            <AppText>{t('kundli.empty')}</AppText>
          ) : (
            <>
              <AppText variant="overline">{t('kundli.people')}</AppText>
              {profiles.map((p) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/kundli/[id]', params: { id: p.id } })}
                  style={({ pressed }) => [styles.person, pressed && styles.pressed]}
                >
                  <View style={styles.avatar}>
                    <AppText variant="heading" style={{ color: colors.backgroundDeep }}>
                      {p.fullName.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">{p.fullName}</AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {t(`kundli.relations.${p.relation}`)} · {isoToDisplay(p.birthDate)}
                      {p.birthTime ? ` · ${p.birthTime}` : ''}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1}>
                      {p.birthPlace.name}
                    </AppText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textFaint} />
                </Pressable>
              ))}
            </>
          )}
          <Button
            title={profiles.length === 0 ? t('kundli.addFirst') : t('kundli.add')}
            onPress={() => router.push({ pathname: '/kundli/new', params: { first: profiles.length === 0 ? '1' : '0' } })}
            icon={<MaterialCommunityIcons name="plus" size={20} color={colors.backgroundDeep} />}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: -spacing.md, marginBottom: spacing.lg },
  loading: { marginTop: spacing.xxl },
  gap: { gap: spacing.md },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  pressed: { opacity: 0.85 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 1 },
});
