import { ActivityIndicator, Text, View } from 'react-native';

export function AnalyzingOverlay() {
  return (
    <View
      pointerEvents="auto"
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
      }}
    >
      <ActivityIndicator size="large" color="#FFFFFF" />
      <Text className="mt-4 text-white text-lg font-rounded-bold">診断中…</Text>
    </View>
  );
}
