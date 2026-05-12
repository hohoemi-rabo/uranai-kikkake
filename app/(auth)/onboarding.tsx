import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setOnboardingCompleted } from '@/lib/onboarding';

type Slide = {
  emoji: string;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    emoji: '✨',
    title: 'あなたの魅力、見つけてみよう',
    body: '顔写真や手のひらから、AI が魅力や運勢をやさしく診断します',
  },
  {
    emoji: '🎉',
    title: '楽しむための占いです',
    body: 'このアプリはエンターテイメントです。気軽に楽しんでください',
  },
  {
    emoji: '📱',
    title: 'スマホでお楽しみください',
    body: 'カメラで撮るか、お持ちの写真を選んで使えます',
  },
  {
    emoji: '🌟',
    title: 'はじめましょう',
    body: '今日もよい一日になりますように',
  },
];

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const offset = useSharedValue(0);

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, next));
    setIndex(clamped);
    offset.value = withTiming(-clamped * width, { duration: 250 });
  };

  const handleFinish = async () => {
    await setOnboardingCompleted();
    router.replace('/(auth)/login');
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -50) {
        runOnJS(goTo)(index + 1);
      } else if (e.translationX > 50) {
        runOnJS(goTo)(index - 1);
      }
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-violet-50" edges={['top', 'bottom']}>
      <GestureDetector gesture={swipe}>
        <View className="flex-1">
          <Animated.View
            style={[
              { flexDirection: 'row', width: width * SLIDES.length, flex: 1 },
              trackStyle,
            ]}
          >
            {SLIDES.map((s, i) => (
              <View
                key={i}
                style={{ width }}
                className="items-center justify-center px-8"
              >
                <Text className="text-7xl">{s.emoji}</Text>
                <Text className="mt-6 text-3xl font-rounded-black text-slate-900 text-center">
                  {s.title}
                </Text>
                <Text className="mt-4 text-lg font-rounded text-slate-700 text-center leading-7">
                  {s.body}
                </Text>
              </View>
            ))}
          </Animated.View>

          <View className="flex-row justify-center gap-2 pb-6">
            {SLIDES.map((_, i) => (
              <View
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i === index ? 'bg-charm' : 'bg-slate-300'
                }`}
              />
            ))}
          </View>

          <View className="px-6 pb-8">
            <Pressable
              onPress={() => (isLast ? handleFinish() : goTo(index + 1))}
              className="bg-charm p-5 rounded-2xl active:opacity-80"
            >
              <Text className="text-center text-lg font-rounded-bold text-white">
                {isLast ? 'はじめる' : '次へ'}
              </Text>
            </Pressable>
          </View>
        </View>
      </GestureDetector>
    </SafeAreaView>
  );
}
