import {
  MPLUSRounded1c_400Regular,
  MPLUSRounded1c_700Bold,
  MPLUSRounded1c_900Black,
  useFonts,
} from '@expo-google-fonts/m-plus-rounded-1c';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { OnboardingProvider, useOnboarding } from '@/hooks/useOnboarding';
import '../global.css';

export const unstable_settings = {
  anchor: '(main)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(Colors.background).catch(() => {});

function RootContent() {
  const [loaded, error] = useFonts({
    MPLUSRounded1c_400Regular,
    MPLUSRounded1c_700Bold,
    MPLUSRounded1c_900Black,
  });
  const { onboardingDone } = useOnboarding();
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if ((loaded || error) && onboardingDone !== null && !authLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error, onboardingDone, authLoading]);

  if ((!loaded && !error) || onboardingDone === null || authLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(main)" />
        <Stack.Screen name="(auth)" />
      </Stack>
      {!onboardingDone && <Redirect href="/(auth)/onboarding" />}
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RootContent />
      </OnboardingProvider>
    </AuthProvider>
  );
}
