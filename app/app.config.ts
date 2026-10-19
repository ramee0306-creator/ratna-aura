import type { ExpoConfig } from 'expo/config';

import { brand } from '../brand.config.js';

// Everything brand-related comes from ../brand.config.ts — edit that file, not this one.
const config: ExpoConfig = {
  name: brand.appName,
  slug: brand.slug,
  owner: undefined,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: brand.scheme,
  userInterfaceStyle: 'dark',
  backgroundColor: brand.colors.background,
  ios: {
    bundleIdentifier: brand.iosBundleId,
    supportsTablet: false,
  },
  android: {
    package: brand.androidPackage,
    // Each Google Play upload needs a higher number; build-aab.yml sets it from the GitHub run number.
    versionCode: Number(process.env.ANDROID_VERSION_CODE ?? 1),
    adaptiveIcon: {
      backgroundColor: brand.colors.background,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Birth data is personal: never include it in Android cloud backups.
    allowBackup: false,
    // Permissions the app does not need (fewer questions on Google Play's Data safety form).
    blockedPermissions: [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
    ],
  },
  web: {
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    'expo-web-browser',
    './plugins/withReleaseSigning',
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Ratna Aura uses the microphone only when you tap it, to type your question by voice.',
        speechRecognitionPermission: 'Ratna Aura turns your spoken question into text on your phone.',
        androidSpeechServicePackages: ['com.google.android.googlequicksearchbox'],
      },
    ],
    ['expo-notifications', { icon: './assets/images/android-icon-monochrome.png', color: brand.colors.gold }],
    [
      'expo-splash-screen',
      {
        backgroundColor: brand.colors.background,
        image: './assets/images/splash-icon.png',
        imageWidth: 120,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
