import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Option<T extends string> = { value: T; label: string };

/** A row of pill buttons where exactly one is selected. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent = colors.gold,
  label,
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  accent?: string;
  label?: string;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, { borderColor: accent }, active && { backgroundColor: accent }]}
          >
            <AppText variant="label" style={{ color: active ? colors.backgroundDeep : colors.text }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
  },
});
