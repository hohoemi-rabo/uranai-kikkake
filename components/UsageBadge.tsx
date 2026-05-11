import { Text, View } from 'react-native';

import { useUsage } from '@/hooks/useUsage';

export function UsageBadge() {
  const { remaining, isLoading } = useUsage();
  if (isLoading) return null;

  const isEmpty = remaining <= 0;
  return (
    <View className={`px-3 py-2 rounded-full ${isEmpty ? 'bg-slate-300' : 'bg-white'}`}>
      <Text
        className={`text-sm font-rounded-bold ${
          isEmpty ? 'text-slate-500' : 'text-slate-700'
        }`}
      >
        今日の残り: {remaining}回
      </Text>
    </View>
  );
}
