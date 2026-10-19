import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { TextField } from './TextField';

const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Every offered language as a card, each written in its own script, with search. */
export function LanguageGrid({ onChoose }: { onChoose: (code: LanguageCode) => void }) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const q = plain(query.trim());
  const matches = AVAILABLE_LANGUAGES.filter(
    (l) => !q || plain(l.englishName).includes(q) || plain(l.nativeName).includes(q) || l.code === q,
  );
  return (
    <View style={styles.wrap}>
      {AVAILABLE_LANGUAGES.length > 8 ? (
        <TextField label={t('language.search')} value={query} onChangeText={setQuery} autoCorrect={false} placeholder="Hindi, தமிழ், বাংলা…" />
      ) : null}
      {matches.length === 0 ? <AppText variant="caption">{t('language.noMatch')}</AppText> : null}
      <View style={styles.grid} accessibilityRole="radiogroup">
        {matches.map((lang) => {
          const active = i18n.language === lang.code;
          return (
            <Pressable
              key={lang.code}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${lang.nativeName}, ${lang.englishName}`}
              onPress={() => onChoose(lang.code)}
              style={({ pressed }) => [styles.card, active && styles.active, pressed && styles.pressed]}
            >
              <View style={styles.text}>
                <AppText variant="heading" style={{ color: active ? colors.goldBright : colors.text }} numberOfLines={1}>
                  {lang.nativeName}
                </AppText>
                {lang.nativeName !== lang.englishName ? <AppText variant="caption">{lang.englishName}</AppText> : null}
              </View>
              {active ? <MaterialCommunityIcons name="check-circle" size={22} color={colors.gold} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface + 'CC',
  },
  active: { borderColor: colors.gold, backgroundColor: colors.surfaceRaised },
  pressed: { opacity: 0.85 },
  text: { flex: 1 },
});
