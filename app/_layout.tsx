import {
  MPLUSRounded1c_400Regular,
  MPLUSRounded1c_700Bold,
  MPLUSRounded1c_900Black,
  useFonts,
} from '@expo-google-fonts/m-plus-rounded-1c';
import { Redirect, Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
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

// 子画面が throw した時にクラッシュ(白画面)を防ぐ。expo-router が自動で拾う。
// Context が壊れている可能性があるので、theme 定数 + 素の style だけで自己完結させる。
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        backgroundColor: Colors.background,
      }}
    >
      <Text style={{ fontSize: 64 }}>🔮</Text>
      <Text
        style={{
          marginTop: 16,
          fontSize: 22,
          fontWeight: '700',
          color: Colors.textPrimary,
          textAlign: 'center',
        }}
      >
        エラーが発生しました
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontSize: 15,
          color: Colors.textMuted,
          textAlign: 'center',
          lineHeight: 22,
        }}
      >
        ご不便をおかけします。{'\n'}もう一度お試しください。
      </Text>
      <Pressable
        onPress={retry}
        style={{
          marginTop: 32,
          paddingVertical: 20,
          paddingHorizontal: 48,
          borderRadius: 16,
          backgroundColor: Colors.charm,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
          もう一度試す
        </Text>
      </Pressable>
      {__DEV__ && (
        <Text
          style={{
            marginTop: 24,
            fontSize: 12,
            color: Colors.textMuted,
            textAlign: 'center',
          }}
        >
          {error.message}
        </Text>
      )}
    </View>
  );
}

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
