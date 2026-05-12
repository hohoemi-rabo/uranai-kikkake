import { Redirect, Stack, usePathname } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const isOnboarding = pathname === '/onboarding';

  if (isLoading) return null;
  if (isAuthenticated && !isOnboarding) return <Redirect href="/(main)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="login" />
    </Stack>
  );
}
