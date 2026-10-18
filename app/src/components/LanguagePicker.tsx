import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LANGUAGES, setLanguage } from '@/i18n';
import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export function LanguagePicker() {
  const { i18n } = useTranslation();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {LANGUAGES.map((lang) => {
        const active = i18n.language === lang.code;
        return (
          <Pressable
            key={lang.code}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => setLanguage(lang.code)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <AppText variant="bodyStrong" style={{ color: active ? colors.backgroundDeep : colors.goldBright }}>
              {lang.nativeName}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  chip: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.gold },
});
