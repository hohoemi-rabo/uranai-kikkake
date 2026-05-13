import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { signInWithGoogle } from '@/lib/auth/google';

const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE ?? 'stub';

function StubLoginButton() {
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
    <Pressable
      onPress={handleSignIn}
      disabled={loading}
      className="bg-charm p-5 rounded-2xl active:opacity-80 disabled:opacity-50"
    >
      <Text className="text-center text-lg font-rounded-bold text-white">
        {loading ? 'ログイン中...' : '(開発用) ログイン'}
      </Text>
    </Pressable>
  );
}

function GoogleLoginButton() {
  const { signInWithSession } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const outcome = await signInWithGoogle();
      if (outcome.ok) {
        await signInWithSession(outcome.session);
      } else if (outcome.reason === 'cancelled') {
        // ユーザーキャンセル: 何もしない
      } else {
        Alert.alert('ログインに失敗しました', outcome.message ?? 'もう一度お試しください');
      }
    } catch (e) {
      Alert.alert(
        'ログインに失敗しました',
        e instanceof Error ? e.message : 'もう一度お試しください',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      className="bg-white p-5 rounded-2xl active:opacity-80 disabled:opacity-50"
      style={{ borderWidth: 2, borderColor: '#4285F4' }}
    >
      <Text className="text-center text-lg font-rounded-bold text-slate-800">
        {loading ? 'ログイン中…' : '🔵  Google でログイン'}
      </Text>
    </Pressable>
  );
}

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-violet-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-7xl">🔮</Text>
        <Text className="mt-6 text-3xl font-rounded-black text-slate-900">
          占いキッカケ
        </Text>
        <Text className="mt-2 text-base font-rounded text-slate-600">
          ログインしてはじめましょう
        </Text>
        <View className="mt-12 w-full">
          {AUTH_MODE === 'google' ? <GoogleLoginButton /> : <StubLoginButton />}
        </View>
      </View>
    </SafeAreaView>
  );
}
