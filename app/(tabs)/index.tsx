import { SafeAreaView, Text, View } from 'react-native';

export default function HomeScreen() {
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
    </SafeAreaView>
  );
}
