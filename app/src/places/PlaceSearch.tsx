import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing } from '@/theme';

import { type Place, searchPlaces } from './search';

/** Type-ahead search over the built-in city list. */
export function PlaceSearch({ value, onChange }: { value: Place | null; onChange: (place: Place | null) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchPlaces(query), [query]);

  if (value) {
    return (
      <View style={styles.wrap}>
        <AppText variant="label">{t('kundli.form.place')}</AppText>
        <Pressable accessibilityRole="button" onPress={() => onChange(null)} style={[styles.row, styles.chosen]}>
          <MaterialCommunityIcons name="map-marker" size={20} color={colors.gold} />
          <AppText style={styles.flex}>{value.label}</AppText>
          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <TextField
        label={t('kundli.form.place')}
        placeholder={t('kundli.form.placePlaceholder')}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {results.length > 0 ? (
        <View style={styles.list}>
          {results.map((place) => (
            <Pressable
              key={`${place.label}|${place.latitude}`}
              accessibilityRole="button"
              onPress={() => {
                onChange(place);
                setQuery('');
              }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.textMuted} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{place.name}</AppText>
                <AppText variant="caption">{[place.state, place.countryName].filter(Boolean).join(', ')}</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : query.trim().length >= 2 ? (
        <AppText variant="caption">{t('kundli.form.noPlaces')}</AppText>
      ) : (
        <AppText variant="caption">{t('kundli.form.placeHint')}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surface },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  chosen: { borderWidth: 1, borderColor: colors.gold, borderRadius: radius.md, backgroundColor: colors.surface, minHeight: 54 },
  pressed: { backgroundColor: colors.surfaceRaised },
  flex: { flex: 1 },
});
