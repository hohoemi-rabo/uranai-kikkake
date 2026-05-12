import * as MediaLibrary from 'expo-media-library';
import { useState, type RefObject } from 'react';
import { Alert, type View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

export function useSaveImage() {
  const [isSaving, setIsSaving] = useState(false);

  async function saveImage(viewRef: RefObject<View | null>) {
    if (isSaving) return;
    if (!viewRef.current) {
      Alert.alert(
        '保存できません',
        'もう少し待ってからもう一度お試しください。',
      );
      return;
    }
    setIsSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert(
          '写真の保存に許可が必要です',
          '設定アプリから「写真への保存」を許可してください。',
        );
        return;
      }
      const uri = await captureRef(viewRef, {
        format: 'jpg',
        quality: 0.9,
        width: 1080,
        result: 'tmpfile',
      });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('保存しました', '写真アプリに保存しました!');
    } catch (e) {
      console.error('saveImage error:', e);
      Alert.alert('保存に失敗しました', 'もう一度お試しください。');
    } finally {
      setIsSaving(false);
    }
  }

  return { saveImage, isSaving };
}
