import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, fonts, radius, spacing } from '@/theme';

import { AppText } from './AppText';

export function TextField({ label, prefix, ...rest }: TextInputProps & { label: string; prefix?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.field}>
        {prefix}
        <TextInput placeholderTextColor={colors.textFaint} style={styles.input} accessibilityLabel={label} {...rest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 54,
    gap: spacing.sm,
  },
  input: { flex: 1, color: colors.text, fontFamily: fonts.bodyMedium, fontSize: 18, paddingVertical: spacing.md },
});
