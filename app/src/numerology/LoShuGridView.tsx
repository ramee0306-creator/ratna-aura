import { LO_SHU_LAYOUT } from '@ratna/numerology';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/theme';

/** The 3×3 grid. Each cell repeats its number as often as it appears ("11"); empty cells show a faint number. */
export function LoShuGridView({ counts }: { counts: Record<number, number> }) {
  return (
    <View style={styles.grid} accessibilityRole="image">
      {LO_SHU_LAYOUT.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((n) => {
            const count = counts[n] ?? 0;
            return (
              <View
                key={n}
                style={[styles.cell, count > 0 && styles.filled]}
                accessible
                accessibilityLabel={count > 0 ? `${n} × ${count}` : `${n}: 0`}
              >
                <Text
                  adjustsFontSizeToFit
                  numberOfLines={1}
                  style={[styles.digit, count > 0 ? styles.present : styles.absent]}
                >
                  {count > 0 ? String(n).repeat(count) : n}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 330,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundDeep,
  },
  row: { flex: 1, flexDirection: 'row' },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.goldDeep + '88',
    paddingHorizontal: 6,
  },
  filled: { backgroundColor: colors.emeraldDeep + '33' },
  digit: { fontFamily: fonts.display, fontSize: 38, lineHeight: 46, fontVariant: ['lining-nums'], letterSpacing: 1 },
  present: { color: colors.emeraldBright },
  absent: { color: colors.textFaint + '66', fontSize: 30 },
});
