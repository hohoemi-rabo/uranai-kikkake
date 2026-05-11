import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-sky-50">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-rounded-black text-slate-900">
          占いキッカケ
        </Text>
        <Text className="mt-4 text-lg font-rounded text-slate-600">
          会話がもっと楽しくなる
        </Text>
        <View className="mt-8 flex-row gap-3">
          <View className="h-6 w-6 rounded-full bg-charm" />
          <View className="h-6 w-6 rounded-full bg-palm" />
          <View className="h-6 w-6 rounded-full bg-match" />
        </View>
      </View>
      {/* チケット 20(設定画面)で移管予定の動作確認用ボタン */}
      <View className="px-6 pb-8">
        <Pressable
          onPress={() => signOut()}
          className="bg-slate-300 p-4 rounded-2xl active:opacity-80"
        >
          <Text className="text-center text-base font-rounded-bold text-slate-700">
            (開発用)ログアウト
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
