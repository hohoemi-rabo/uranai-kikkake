import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HintText } from '@/components/HintText';
import { TabSwitcher } from '@/components/TabSwitcher';
import { UsageBadge } from '@/components/UsageBadge';
import { TabAccent, type TabKey } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useUsage } from '@/hooks/useUsage';

const TAB_BG: Record<TabKey, string> = {
  charm: 'bg-charm',
  palm: 'bg-palm',
  match: 'bg-match',
};

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { remaining } = useUsage();
  const [tab, setTab] = useState<TabKey>('charm');

  const isEmpty = remaining <= 0;
  const cameraBg = isEmpty ? 'bg-slate-300' : TAB_BG[tab];
  const cameraTextColor = isEmpty ? 'text-slate-500' : 'text-white';

  const handleCamera = () => {
    Alert.alert('カメラ', 'チケット 12 で実装予定です');
  };
  const handlePicker = () => {
    Alert.alert('写真選択', 'チケット 13 で実装予定です');
  };
  const handleSettings = () => {
    Alert.alert('設定', 'チケット 20 で実装予定です');
  };

  return (
    <SafeAreaView className="flex-1 bg-sky-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <Pressable onPress={handleSettings} className="p-2 active:opacity-60">
          <Text className="text-2xl">⚙️</Text>
        </Pressable>
        <UsageBadge />
      </View>

      <View className="flex-1 px-6 pt-2 justify-between pb-6">
        <View>
          <Text className="text-center text-3xl font-rounded-black text-slate-900">
            占いキッカケ
          </Text>
          <Text className="text-center mt-1 text-base font-rounded text-slate-500">
            会話がもっと楽しくなる
          </Text>

          <View className="mt-8">
            <TabSwitcher value={tab} onChange={setTab} />
          </View>
        </View>

        <View>
          <View className="mb-4">
            <HintText tab={tab} />
          </View>

          <Pressable
            disabled={isEmpty}
            onPress={handleCamera}
            className={`p-5 rounded-2xl active:opacity-80 ${cameraBg}`}
          >
            <Text className={`text-center text-xl font-rounded-bold ${cameraTextColor}`}>
              📷 カメラで撮る
            </Text>
          </Pressable>

          <Pressable
            disabled={isEmpty}
            onPress={handlePicker}
            className={`mt-3 p-5 rounded-2xl active:opacity-80 ${
              isEmpty ? 'bg-slate-300' : 'bg-white border-2'
            }`}
            style={!isEmpty ? { borderColor: TabAccent[tab] } : undefined}
          >
            <Text
              className={`text-center text-xl font-rounded-bold ${
                isEmpty ? 'text-slate-500' : ''
              }`}
              style={!isEmpty ? { color: TabAccent[tab] } : undefined}
            >
              📁 写真から選ぶ
            </Text>
          </Pressable>
        </View>
      </View>

      {/* チケット 20(設定画面)で正式な場所に移管予定 */}
      <View className="px-6 pb-4">
        <Pressable onPress={() => signOut()} className="py-2 active:opacity-60">
          <Text className="text-center text-xs font-rounded text-slate-400 underline">
            (開発用)ログアウト
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
