import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function Button({ title, onPress, variant = 'gold', disabled, loading, icon, style }: Props) {
  const inactive = disabled || loading;
  const textColor =
    variant === 'gold' ? colors.backgroundDeep : variant === 'danger' ? colors.danger : colors.goldBright;

  const inner = (
    <View style={styles.inner}>
      {loading ? <ActivityIndicator color={textColor} /> : icon}
      <AppText variant="bodyStrong" style={{ color: textColor }}>
        {title}
      </AppText>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        variant === 'outline' && styles.outline,
        variant === 'danger' && styles.danger,
        { opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {variant === 'gold' ? (
        <LinearGradient
          colors={[colors.goldBright, colors.gold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.pill, overflow: 'hidden', minHeight: 52, justifyContent: 'center' },
  gradient: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  outline: { borderWidth: 1, borderColor: colors.gold },
  danger: { borderWidth: 1, borderColor: colors.danger },
});
