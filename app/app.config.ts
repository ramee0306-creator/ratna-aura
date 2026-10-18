import type { ExpoConfig } from 'expo/config';

import { brand } from '../brand.config.js';

// Everything brand-related comes from ../brand.config.ts — edit that file, not this one.
const config: ExpoConfig = {
  name: brand.appName,
  slug: brand.slug,
  owner: undefined,
  version: '0.1.0',
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
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: brand.colors.background,
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    // Birth data is personal: never include it in Android cloud backups.
    allowBackup: false,
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
