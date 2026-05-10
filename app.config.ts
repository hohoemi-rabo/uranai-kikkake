import type { ConfigContext, ExpoConfig } from 'expo/config';

const IS_PROD = process.env.APP_ENV === 'production';
const BUNDLE_BASE = 'jp.hohoemi-rabo.uranaikikkake';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? '占いキッカケ' : '占いキッカケDev',
  slug: 'uranai-kikkake',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'uranaikikkake',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PROD ? BUNDLE_BASE : `${BUNDLE_BASE}.dev`,
  },
  android: {
    package: IS_PROD ? BUNDLE_BASE : `${BUNDLE_BASE}.dev`,
    adaptiveIcon: {
      backgroundColor: '#F0F9FF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#F0F9FF',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
