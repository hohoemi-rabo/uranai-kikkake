import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ScreenBackground } from '@/components/ScreenBackground';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <ScreenBackground>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-7xl" style={{ lineHeight: 96 }}>🔮</Text>
        <Text className="mt-6 text-2xl font-rounded-bold text-white text-center">
          ページが見つかりません
        </Text>
        <Text className="mt-3 text-base font-rounded text-slate-200 text-center leading-6">
          お探しの画面は見つかりませんでした。{'\n'}ホームからやりなおしてください。
        </Text>
        <Pressable
          onPress={() => router.replace('/(main)')}
          className="mt-10 p-5 rounded-2xl bg-charm active:opacity-80"
        >
          <Text className="text-center text-xl font-rounded-bold text-white">
            ホームに戻る
          </Text>
        </Pressable>
      </View>
    </ScreenBackground>
  );
}
