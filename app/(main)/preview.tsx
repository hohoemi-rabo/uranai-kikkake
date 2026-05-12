import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnalyzingOverlay } from '@/components/AnalyzingOverlay';
import { isTabKey, TabAccent, type TabKey } from '@/constants/theme';
import { useDivine } from '@/hooks/useDivine';
import { prepareForUpload } from '@/lib/image';

const CTA_LABEL: Record<TabKey, string> = {
  charm: '魅力を発見する',
  palm: '占ってみる',
  match: '占ってみる',
};

export default function PreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; uri?: string }>();
  const mode: TabKey = isTabKey(params.mode) ? params.mode : 'charm';
  const uri = typeof params.uri === 'string' ? params.uri : '';
  const { divine } = useDivine();
  const [analyzing, setAnalyzing] = useState(false);

  if (!uri) {
    return (
      <SafeAreaView className="flex-1 bg-violet-50 items-center justify-center">
        <Text className="text-base font-rounded text-slate-700">画像が見つかりません</Text>
        <Pressable onPress={() => router.back()} className="mt-4 p-3">
          <Text className="text-base font-rounded-bold text-slate-700 underline">戻る</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSubmit = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      const prepared = await prepareForUpload(uri);
      const outcome = await divine(mode, prepared.base64);
      if (outcome.ok) {
        router.replace({
          pathname: '/(main)/result',
          params: { result: JSON.stringify(outcome.result), mode, uri },
        });
        return;
      }
      switch (outcome.kind) {
        case 'rate-limit':
          Alert.alert(
            '今日はもう3回占いました',
            `また明日会いましょう!\n(リセット: ${outcome.resetAt})`,
          );
          break;
        case 'gemini-failed':
          Alert.alert('診断に失敗しました', 'もう一度お試しください。');
          break;
        case 'unauthorized':
          // apiFetch の 401 ハンドラが signOut を呼ぶので、ガード Redirect で自動的にログイン画面に戻る
          break;
        case 'network':
          Alert.alert('通信エラー', '電波の良い場所でもう一度お試しください。');
          break;
        case 'other':
          Alert.alert('エラー', outcome.message);
          break;
      }
    } catch (e) {
      console.error('divine flow error:', e);
      Alert.alert('エラー', '画像の処理中に問題が起きました。');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-violet-50" edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pt-2 pb-6">
        <Pressable
          onPress={() => router.back()}
          disabled={analyzing}
          className="self-start p-2 active:opacity-60"
        >
          <Text className="text-base font-rounded-bold text-slate-700">← 撮り直す</Text>
        </Pressable>

        <View className="flex-1 mt-4 mb-4 items-center justify-center">
          <Image
            source={{ uri }}
            style={{ flex: 1, width: '100%', borderRadius: 16 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={analyzing}
          className="p-5 rounded-2xl active:opacity-80"
          style={{ backgroundColor: TabAccent[mode] }}
        >
          <Text className="text-center text-xl font-rounded-bold text-white">
            {CTA_LABEL[mode]}
          </Text>
        </Pressable>
      </View>

      {analyzing && <AnalyzingOverlay mode={mode} />}
    </SafeAreaView>
  );
}
