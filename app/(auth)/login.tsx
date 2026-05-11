import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sky-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-7xl">🔮</Text>
        <Text className="mt-6 text-3xl font-rounded-black text-slate-900">
          占いキッカケ
        </Text>
        <Text className="mt-2 text-base font-rounded text-slate-600">
          ログインしてはじめましょう
        </Text>
        <View className="mt-12 w-full">
          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            className="bg-charm p-5 rounded-2xl active:opacity-80 disabled:opacity-50"
          >
            <Text className="text-center text-lg font-rounded-bold text-white">
              {loading ? 'ログイン中...' : '(開発用)ログイン'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
