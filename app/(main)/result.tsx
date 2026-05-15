import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ResultCard } from '@/components/ResultCard';
import { ScreenBackground } from '@/components/ScreenBackground';
import { TypewriterText } from '@/components/TypewriterText';
import { Colors, isTabKey, type TabKey } from '@/constants/theme';
import type { DivineResultBody } from '@/hooks/useDivine';
import { useSaveImage } from '@/hooks/useSaveImage';
import { useSpeech } from '@/hooks/useSpeech';

const MODE_LABEL: Record<TabKey, string> = {
  charm: '🌟 魅力発見',
  palm: '✋ 手相',
  match: '💖 相性',
};

const LUCKY_HEADING: Record<TabKey, string> = {
  charm: '魅力を引き立てるアイテム',
  palm: '開運アイテム',
  match: '開運アイテム',
};

const TYPING_INTERVAL_MS = 35;
const FADE_DURATION = 600;
const TYPING_CAP_MS = 9000;
// Web 版 spec の cubic-bezier(0.23, 1, 0.32, 1) と同等
const FADE_EASING = Easing.bezier(0.23, 1, 0.32, 1);

function parseResult(raw: string | string[] | undefined): DivineResultBody | null {
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DivineResultBody>;
    if (
      typeof parsed.title !== 'string' ||
      typeof parsed.animal !== 'string' ||
      typeof parsed.personality !== 'string' ||
      typeof parsed.luckyItem !== 'string' ||
      typeof parsed.advice !== 'string' ||
      typeof parsed.icebreaker !== 'string'
    ) {
      return null;
    }
    return parsed as DivineResultBody;
  } catch {
    return null;
  }
}

type SectionProps = {
  delayMs: number;
  children: React.ReactNode;
};

function StaggerSection({ delayMs, children }: SectionProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withTiming(1, { duration: FADE_DURATION, easing: FADE_EASING }),
    );
    translateY.value = withDelay(
      delayMs,
      withTiming(0, { duration: FADE_DURATION, easing: FADE_EASING }),
    );
  }, [delayMs, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animStyle}>{children}</Animated.View>;
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ result?: string; mode?: string; uri?: string }>();
  const mode: TabKey = isTabKey(params.mode) ? params.mode : 'charm';
  const result = parseResult(params.result);
  const photoUri = typeof params.uri === 'string' ? params.uri : '';
  const accent = Colors[mode];
  const { speak, stop, isSpeaking } = useSpeech();
  const { saveImage, isSaving } = useSaveImage();
  const cardRef = useRef<View>(null);

  useEffect(() => {
    if (!result) {
      router.replace('/(main)');
    }
  }, [result, router]);

  if (!result) return null;

  const typingMs = Math.min(result.personality.length * TYPING_INTERVAL_MS, TYPING_CAP_MS);
  // タイプライター完了後、下 3 カード(開運アイテム / アドバイス / おすすめの話題)を同時に出す
  const bottomDelay = 800 + typingMs + 300;
  const STAGGER = {
    title: 0,
    animal: 400,
    message: 800,
    lucky: bottomDelay,
    advice: bottomDelay,
    icebreaker: bottomDelay,
  };

  return (
    <ScreenBackground edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
        <Pressable onPress={() => router.replace('/(main)')} className="p-2 active:opacity-60">
          <Text className="text-base font-rounded-bold text-slate-200">← 最初に戻る</Text>
        </Pressable>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: accent }}>
          <Text className="text-sm font-rounded-bold text-white">{MODE_LABEL[mode]}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <StaggerSection delayMs={STAGGER.title}>
          <View className="bg-white rounded-2xl p-5 flex-row items-center justify-between">
            <Text
              className="flex-1 text-2xl font-rounded-bold"
              style={{ color: Colors.textPrimary }}
            >
              {result.title}
            </Text>
            {mode === 'match' && typeof result.score === 'number' && (
              <View className="ml-3 items-center">
                <Text className="text-xs font-rounded text-slate-500">スコア</Text>
                <Text className="text-3xl font-rounded-bold" style={{ color: accent }}>
                  {result.score}
                </Text>
              </View>
            )}
          </View>
        </StaggerSection>

        <StaggerSection delayMs={STAGGER.animal}>
          <View
            className="bg-white rounded-2xl p-5"
            style={{ borderLeftWidth: 4, borderLeftColor: accent }}
          >
            <Text className="text-xs font-rounded text-slate-500 mb-1">似ている動物</Text>
            <Text
              className="text-xl font-rounded-bold"
              style={{ color: Colors.textPrimary }}
            >
              {result.animal}
            </Text>
          </View>
        </StaggerSection>

        <StaggerSection delayMs={STAGGER.message}>
          <View className="bg-slate-50 rounded-2xl p-5">
            <Text
              className="text-lg font-rounded-bold mb-2"
              style={{ color: accent }}
            >
              あなたへのメッセージ
            </Text>
            <TypewriterText
              text={result.personality}
              intervalMs={TYPING_INTERVAL_MS}
              startDelayMs={STAGGER.message}
              className="text-lg font-rounded leading-7"
              style={{ color: Colors.textSecondary }}
            />
          </View>
        </StaggerSection>

        <StaggerSection delayMs={STAGGER.lucky}>
          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: Colors.luckyItem,
              borderLeftWidth: 4,
              borderLeftColor: accent,
            }}
          >
            <Text
              className="text-lg font-rounded-bold mb-2"
              style={{ color: accent }}
            >
              {LUCKY_HEADING[mode]}
            </Text>
            <Text
              className="text-lg font-rounded leading-7"
              style={{ color: Colors.textSecondary }}
            >
              {result.luckyItem}
            </Text>
          </View>
        </StaggerSection>

        <StaggerSection delayMs={STAGGER.advice}>
          <View
            className="rounded-2xl p-5"
            style={{
              backgroundColor: Colors.advice,
              borderLeftWidth: 4,
              borderLeftColor: accent,
            }}
          >
            <Text
              className="text-lg font-rounded-bold mb-2"
              style={{ color: accent }}
            >
              ひとことアドバイス
            </Text>
            <Text
              className="text-lg font-rounded leading-7"
              style={{ color: Colors.textSecondary }}
            >
              {result.advice}
            </Text>
          </View>
        </StaggerSection>

        <StaggerSection delayMs={STAGGER.icebreaker}>
          <View
            className="bg-white rounded-2xl p-5"
            style={{ borderLeftWidth: 4, borderLeftColor: accent }}
          >
            <Text
              className="text-lg font-rounded-bold mb-2"
              style={{ color: accent }}
            >
              おすすめの話題
            </Text>
            <Text
              className="text-lg font-rounded leading-7"
              style={{ color: Colors.textSecondary }}
            >
              {result.icebreaker}
            </Text>
          </View>
        </StaggerSection>

        <View className="mt-2 gap-3">
          <Pressable
            onPress={() =>
              isSpeaking
                ? stop()
                : speak([result.animal, result.personality, result.icebreaker])
            }
            className="p-5 rounded-2xl bg-white active:opacity-80"
            style={{ borderWidth: 2, borderColor: accent }}
          >
            <Text
              className="text-center text-lg font-rounded-bold"
              style={{ color: accent }}
            >
              {isSpeaking ? '⏸ 停止' : '🔊 読み上げる'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => saveImage(cardRef)}
            disabled={isSaving || !photoUri}
            className="p-5 rounded-2xl bg-white active:opacity-80"
            style={{
              borderWidth: 2,
              borderColor: accent,
              opacity: isSaving || !photoUri ? 0.6 : 1,
            }}
          >
            <Text
              className="text-center text-lg font-rounded-bold"
              style={{ color: accent }}
            >
              {isSaving ? '保存中…' : '💾 画像を保存'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(main)')}
            className="p-5 rounded-2xl active:opacity-80"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-center text-xl font-rounded-bold text-white">
              最初に戻る
            </Text>
          </Pressable>
        </View>

        <Text className="text-xs text-slate-300 text-center font-rounded pt-2">
          ※ 占いはエンターテイメントです。会話のきっかけとしてお楽しみください。
        </Text>
      </ScrollView>

      {photoUri ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -10000, left: 0, opacity: 0 }}
        >
          <ResultCard
            ref={cardRef}
            mode={mode}
            result={result}
            photoUri={photoUri}
          />
        </View>
      ) : null}
    </ScreenBackground>
  );
}
