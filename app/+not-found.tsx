import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-violet-50">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-7xl">🔮</Text>
        <Text className="mt-6 text-2xl font-rounded-bold text-slate-900 text-center">
          ページが見つかりません
        </Text>
        <Text className="mt-3 text-base font-rounded text-slate-600 text-center leading-6">
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
    </SafeAreaView>
  );
}
