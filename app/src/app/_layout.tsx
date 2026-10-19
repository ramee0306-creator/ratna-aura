import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  useFonts as useCormorant,
} from '@expo-google-fonts/cormorant-garamond';
import { Hind_400Regular, Hind_500Medium, Hind_600SemiBold, useFonts as useHind } from '@expo-google-fonts/hind';
import { Poppins_500Medium, Poppins_600SemiBold, useFonts as usePoppins } from '@expo-google-fonts/poppins';
import { TiroDevanagariHindi_400Regular, useFonts as useTiro } from '@expo-google-fonts/tiro-devanagari-hindi';
import * as Notifications from 'expo-notifications';
import { DarkTheme, router, SplashScreen, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { initI18n } from '@/i18n';
import { NumerologyProvider } from '@/numerology/NumerologyProvider';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  // Show reminders even when the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Opens the screen a tapped notification points to (e.g. the daily rashifal reminder). */
function useNotificationLinks(ready: boolean) {
  useEffect(() => {
    if (Platform.OS === 'web' || !ready) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) router.push(url as never);
    };
    Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [ready]);
}

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.background, card: colors.background, primary: colors.gold },
};

function RootNavigator() {
  const { status, needsConsent } = useAuth();
  const signedOut = status === 'signedOut';
  const signedIn = status === 'signedIn';

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);
  useNotificationLinks(status === 'signedIn' && !needsConsent);

  if (status === 'loading') return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {/* Before sign-in */}
      <Stack.Protected guard={signedOut} redirectTo="/">
        <Stack.Screen name="welcome" />
        <Stack.Screen name="consent" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify" />
      </Stack.Protected>

      {/* Signed in, but must still confirm 18+ and the privacy notice */}
      <Stack.Protected guard={signedIn && needsConsent} redirectTo="/">
        <Stack.Screen name="accept-terms" />
      </Stack.Protected>

      {/* The real app */}
      <Stack.Protected guard={signedIn && !needsConsent} redirectTo={signedIn ? '/accept-terms' : '/welcome'}>
        <Stack.Screen name="index" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="numerology" />
        <Stack.Screen name="kundli" />
        <Stack.Screen name="rashifal" />
        <Stack.Screen name="panchang" />
        <Stack.Screen name="milan" />
        <Stack.Screen name="ask" />
        <Stack.Screen name="credits" />
        <Stack.Screen name="personas" />
        <Stack.Screen name="persona/[id]" />
        <Stack.Screen name="admin" />
      </Stack.Protected>

      {/* Always reachable */}
      <Stack.Screen name="language" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="auth/callback" />
    </Stack>
  );
}

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [poppinsLoaded] = usePoppins({ Poppins_500Medium, Poppins_600SemiBold });
  const [hindLoaded] = useHind({ Hind_400Regular, Hind_500Medium, Hind_600SemiBold });
  const [cormorantLoaded] = useCormorant({ CormorantGaramond_600SemiBold, CormorantGaramond_700Bold });
  const [tiroLoaded] = useTiro({ TiroDevanagariHindi_400Regular });

  useEffect(() => {
    initI18n().finally(() => setI18nReady(true));
  }, []);

  if (!i18nReady || !poppinsLoaded || !hindLoaded || !cormorantLoaded || !tiroLoaded) return null;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <NumerologyProvider>
          <RootNavigator />
        </NumerologyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
