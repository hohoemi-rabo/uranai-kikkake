import { Redirect, Tabs } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.charm,
        tabBarStyle: { backgroundColor: Colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
        }}
      />
    </Tabs>
  );
}
