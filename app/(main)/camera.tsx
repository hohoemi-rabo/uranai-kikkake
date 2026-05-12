import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ModeFrameOverlay } from '@/components/CameraFrame';
import { TabAccent, type TabKey } from '@/constants/theme';

function isTabKey(v: unknown): v is TabKey {
  return v === 'charm' || v === 'palm' || v === 'match';
}

export default function CameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const mode: TabKey = isTabKey(params.mode) ? params.mode : 'charm';

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>(mode === 'charm' ? 'front' : 'back');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-violet-50" edges={['top', 'bottom']}>
        <View className="flex-1 px-6 items-center justify-center">
          <Text className="text-6xl">📷</Text>
          <Text className="mt-6 text-2xl font-rounded-bold text-slate-900 text-center">
            カメラの使用を許可してください
          </Text>
          <Text className="mt-3 text-base font-rounded text-slate-600 text-center">
            人相・手相を診断するためにカメラを使用します
          </Text>
          <View className="mt-10 w-full">
            <Pressable
              onPress={requestPermission}
              className="p-5 rounded-2xl active:opacity-80"
              style={{ backgroundColor: TabAccent[mode] }}
            >
              <Text className="text-center text-lg font-rounded-bold text-white">
                許可する
              </Text>
            </Pressable>
            {permission.canAskAgain === false && (
              <Pressable
                onPress={() => Linking.openSettings()}
                className="mt-4 p-3 active:opacity-60"
              >
                <Text className="text-center text-base font-rounded text-slate-600 underline">
                  設定アプリで許可する
                </Text>
              </Pressable>
            )}
            <Pressable onPress={() => router.back()} className="mt-2 p-3 active:opacity-60">
              <Text className="text-center text-sm font-rounded text-slate-500 underline">
                戻る
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });
      if (!photo) throw new Error('capture returned null');
      router.push({ pathname: '/(main)/preview', params: { mode, uri: photo.uri } });
    } catch (e) {
      console.error('camera capture error:', e);
      Alert.alert('エラー', '撮影に失敗しました。もう一度お試しください。');
    } finally {
      setCapturing(false);
    }
  };

  const toggleFacing = () => setFacing((f) => (f === 'front' ? 'back' : 'front'));

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <CameraView ref={cameraRef} facing={facing} style={{ flex: 1 }}>
        <ModeFrameOverlay mode={mode} />

        <SafeAreaView
          style={{ flex: 1, justifyContent: 'space-between' }}
          edges={['top', 'bottom']}
        >
          <View className="flex-row justify-between px-4 pt-2">
            <Pressable
              onPress={() => router.back()}
              className="px-4 py-2 rounded-full active:opacity-60"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <Text className="text-white text-base font-rounded-bold">← 戻る</Text>
            </Pressable>
            <Pressable
              onPress={toggleFacing}
              className="px-4 py-2 rounded-full active:opacity-60"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <Text className="text-white text-base font-rounded-bold">🔄 切替</Text>
            </Pressable>
          </View>

          <View className="items-center pb-10">
            <Pressable
              onPress={handleCapture}
              disabled={capturing}
              className="rounded-full active:opacity-80"
              style={{
                padding: 6,
                borderWidth: 4,
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: capturing ? '#94A3B8' : TabAccent[mode],
                }}
              />
            </Pressable>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
