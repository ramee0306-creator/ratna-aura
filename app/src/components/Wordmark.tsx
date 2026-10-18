import { brand } from '@brand';
import Svg, { Defs, LinearGradient, Stop, Text, TSpan } from 'react-native-svg';

import { colors, fonts } from '@/theme';

/**
 * The app name as a logo: first word in metallic gold, second in emerald
 * (names and colours come from brand.config.js).
 */
export function Wordmark({ height = 64 }: { height?: number }) {
  const width = height * 5.2;
  return (
    <Svg width={width} height={height} viewBox="0 0 520 100" accessibilityLabel={brand.appName}>
      <Defs>
        <LinearGradient id="wmGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBEBB5" />
          <Stop offset="0.45" stopColor={colors.goldBright} />
          <Stop offset="0.7" stopColor={colors.gold} />
          <Stop offset="1" stopColor={colors.goldDeep} />
        </LinearGradient>
        <LinearGradient id="wmEmerald" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A5F0CB" />
          <Stop offset="0.45" stopColor={colors.emeraldBright} />
          <Stop offset="1" stopColor={colors.emerald} />
        </LinearGradient>
      </Defs>
      <Text x="260" y="76" textAnchor="middle" fontSize="88" fontFamily={fonts.display}>
        <TSpan fill="url(#wmGold)">{brand.logo.first} </TSpan>
        <TSpan fill="url(#wmEmerald)">{brand.logo.second}</TSpan>
      </Text>
    </Svg>
  );
}
