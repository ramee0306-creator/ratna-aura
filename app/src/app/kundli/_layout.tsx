import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function KundliLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: colors.background } }} />;
}
