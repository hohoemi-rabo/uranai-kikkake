import type { ConfigContext, ExpoConfig } from 'expo/config';

const IS_PROD = process.env.APP_ENV === 'production';
const BUNDLE_BASE = 'jp.hohoemirabo.uranaikikkake';

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
      backgroundColor: '#F5F3FF',
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
        backgroundColor: '#F5F3FF',
      },
    ],
    [
      'expo-camera',
      {
        cameraPermission: '人相・手相を診断するためにカメラを使用します',
        microphonePermission: false,
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'お持ちの写真から診断するために使用します',
        cameraPermission: '人相・手相を診断するためにカメラを使用します',
        microphonePermission: false,
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission: 'お持ちの写真から診断するために使用します',
        savePhotosPermission: '診断結果の画像を保存します',
        isAccessMediaLocationEnabled: false,
      },
    ],
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '031e6171-96a4-4eec-852b-a304c30ed32e',
    },
  },
});
