import { LinearGradient } from 'expo-linear-gradient';
import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/theme';

// Same "random" stars every time (seeded), so the sky does not jump between screens.
function makeStars(count: number) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 200,
    r: rand() < 0.88 ? 0.12 + rand() * 0.14 : 0.3 + rand() * 0.15,
    o: 0.25 + rand() * 0.6,
  }));
}

const STARS = makeStars(90);

/** Deep indigo night sky with a soft glow and quiet stars. Sits behind every screen. */
export const StarryBackground = memo(function StarryBackground() {
  return (
    <>
      <LinearGradient
        colors={[colors.backgroundGlow, colors.background, colors.backgroundDeep]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        {STARS.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill={colors.star} opacity={s.o} />
        ))}
      </Svg>
    </>
  );
});
