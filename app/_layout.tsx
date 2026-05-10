import {
  MPLUSRounded1c_400Regular,
  MPLUSRounded1c_700Bold,
  MPLUSRounded1c_900Black,
  useFonts,
} from '@expo-google-fonts/m-plus-rounded-1c';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(Colors.background).catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    MPLUSRounded1c_400Regular,
    MPLUSRounded1c_700Bold,
    MPLUSRounded1c_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
