import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

/** Every offered language as a card, each written in its own script. */
export function LanguageGrid({ onChoose }: { onChoose: (code: LanguageCode) => void }) {
  const { i18n } = useTranslation();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {AVAILABLE_LANGUAGES.map((lang) => {
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
              <AppText variant="heading" style={{ color: active ? colors.goldBright : colors.text }}>
                {lang.nativeName}
              </AppText>
              {lang.code !== 'en' ? <AppText variant="caption">{lang.englishName}</AppText> : null}
            </View>
            {active ? <MaterialCommunityIcons name="check-circle" size={22} color={colors.gold} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
