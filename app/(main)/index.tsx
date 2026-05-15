import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';

import { HintModal } from '@/components/HintModal';
import { HintText } from '@/components/HintText';
import { ScreenBackground } from '@/components/ScreenBackground';
import { TabSwitcher } from '@/components/TabSwitcher';
import { UsageBadge } from '@/components/UsageBadge';
import { TabAccent, type TabKey } from '@/constants/theme';
import { useUsage } from '@/hooks/useUsage';

const TAB_BG: Record<TabKey, string> = {
  charm: 'bg-charm',
  palm: 'bg-palm',
  match: 'bg-match',
};

export default function HomeScreen() {
  const router = useRouter();
  const { remaining } = useUsage();
  const [tab, setTab] = useState<TabKey>('charm');
  const [picking, setPicking] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const isEmpty = remaining <= 0;
  const cameraBg = isEmpty ? 'bg-white/20' : TAB_BG[tab];
  const cameraTextColor = isEmpty ? 'text-slate-300' : 'text-white';

  const handleCamera = () => {
    router.push({ pathname: '/(main)/camera', params: { mode: tab } });
  };
  const handlePicker = async () => {
    if (picking) return;
    setPicking(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        if (perm.canAskAgain === false) {
          Alert.alert(
            '写真へのアクセスが許可されていません',
            '端末の設定アプリから「占いキッカケ」の写真への許可を ON にしてください。',
            [
              { text: 'キャンセル', style: 'cancel' },
              { text: '設定を開く', onPress: () => Linking.openSettings() },
            ],
          );
        } else {
          Alert.alert(
            '写真の使用を許可してください',
            'お持ちの写真から診断するために必要です。',
          );
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });
      if (result.canceled || !result.assets[0]) return;

      const uri = result.assets[0].uri;
      router.push({ pathname: '/(main)/preview', params: { mode: tab, uri } });
    } catch (e) {
      console.error('image picker error:', e);
      Alert.alert('エラー', '画像の選択に失敗しました。もう一度お試しください。');
    } finally {
      setPicking(false);
    }
  };
  const handleSettings = () => {
    router.push('/(main)/settings');
  };
  const handleHint = () => {
    setHintVisible(true);
  };

  return (
    <ScreenBackground edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-2">
        <Pressable onPress={handleSettings} className="p-2 active:opacity-60">
          <Text className="text-2xl">⚙️</Text>
        </Pressable>
        <UsageBadge />
      </View>

      <View className="flex-1 px-6 pt-2 justify-between pb-6">
        <View>
          <Text className="text-center text-3xl font-rounded-black text-white">
            占いキッカケ
          </Text>
          <Text className="text-center mt-1 text-base font-rounded text-slate-200">
            会話がもっと楽しくなる
          </Text>

          <View className="mt-8">
            <TabSwitcher value={tab} onChange={setTab} />
          </View>
        </View>

        <View>
          <View className="mb-2">
            <HintText tab={tab} />
          </View>

          <Pressable
            onPress={handleHint}
            className="self-center mb-3 py-2 px-4 active:opacity-60"
          >
            <Text
              className="text-base font-rounded underline"
              style={{ color: TabAccent[tab] }}
            >
              💡 こんな写真もおすすめ
            </Text>
          </Pressable>

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
            disabled={isEmpty || picking}
            onPress={handlePicker}
            className={`mt-3 p-5 rounded-2xl active:opacity-80 ${
              isEmpty ? 'bg-white/20' : 'bg-white border-2'
            }`}
            style={!isEmpty ? { borderColor: TabAccent[tab] } : undefined}
          >
            <Text
              className={`text-center text-xl font-rounded-bold ${
                isEmpty ? 'text-slate-300' : ''
              }`}
              style={!isEmpty ? { color: TabAccent[tab] } : undefined}
            >
              📁 写真から選ぶ
            </Text>
          </Pressable>
        </View>
      </View>

      <HintModal
        visible={hintVisible}
        mode={tab}
        onClose={() => setHintVisible(false)}
      />
    </ScreenBackground>
  );
}
