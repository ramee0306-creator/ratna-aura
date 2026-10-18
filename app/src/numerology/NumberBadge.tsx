import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

/** A glowing round medallion showing one number. */
export function NumberBadge({ value, size = 64, tone = 'emerald' }: { value: number | string; size?: number; tone?: 'emerald' | 'gold' }) {
  const ring = tone === 'gold' ? [colors.goldBright, colors.goldDeep] : [colors.emeraldBright, colors.emeraldDeep];
  return (
    <LinearGradient
      colors={ring as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, padding: 2 }}
    >
      <View style={[styles.inner, { borderRadius: size / 2 }]}>
        <Text
          accessibilityRole="text"
          style={[styles.number, { fontSize: size * 0.5, lineHeight: size * 0.62, color: tone === 'gold' ? colors.goldBright : colors.emeraldBright }]}
        >
          {value}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, backgroundColor: colors.backgroundDeep, alignItems: 'center', justifyContent: 'center' },
  number: { fontFamily: fonts.display, textAlign: 'center', fontVariant: ['lining-nums'] },
});
