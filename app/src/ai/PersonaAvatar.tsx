import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';

import { colors } from '@/theme';

import type { PersonaInfo } from './personas';

/** A round badge in the persona's colour with its symbol (no photos: they are AI, not people). */
export function PersonaAvatar({ persona, size = 52 }: { persona: PersonaInfo; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: persona.color, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <MaterialCommunityIcons name={persona.icon} size={size * 0.52} color={colors.backgroundDeep} />
    </View>
  );
}
