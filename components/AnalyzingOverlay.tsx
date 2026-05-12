import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors, type TabKey } from '@/constants/theme';

type ModeConfig = {
  emoji: string;
  accent: string;
  messages: string[];
};

const MODE_CONFIG: Record<TabKey, ModeConfig> = {
  charm: {
    emoji: '✨',
    accent: Colors.charm,
    messages: [
      'あなたの魅力を見つけています…',
      '素敵なところを探しています…',
      'もう少しでお会いできます…',
    ],
  },
  palm: {
    emoji: '🔮',
    accent: Colors.palm,
    messages: [
      '手相を読み解いています…',
      '運勢の線をたどっています…',
      'もう少しでお会いできます…',
    ],
  },
  match: {
    emoji: '💖',
    accent: Colors.match,
    messages: [
      'お二人の縁を見ています…',
      'ご縁を結んでいます…',
      'もう少しでお会いできます…',
    ],
  },
};

const SPARKLE_POSITIONS = [
  { top: 0, left: '50%' as const, marginLeft: -18 },
  { right: 0, top: '50%' as const, marginTop: -18 },
  { bottom: 0, left: '50%' as const, marginLeft: -18 },
  { left: 0, top: '50%' as const, marginTop: -18 },
];

// Web 版 spec の cubic-bezier(0.23, 1, 0.32, 1) と同等
const SLIDE_UP_BEZIER = Easing.bezier(0.23, 1, 0.32, 1);

type Props = {
  mode: TabKey;
};

export function AnalyzingOverlay({ mode }: Props) {
  const { emoji, accent, messages } = MODE_CONFIG[mode];
  const [msgIdx, setMsgIdx] = useState(0);

  const enterTranslate = useSharedValue(40);
  const enterOpacity = useSharedValue(0);
  const pulse = useSharedValue(1);
  const sparkleRotate = useSharedValue(0);
  const ringRotate = useSharedValue(0);
  const messageOpacity = useSharedValue(1);

  useEffect(() => {
    // 入場(slideUp)
    enterTranslate.value = withTiming(0, { duration: 350, easing: SLIDE_UP_BEZIER });
    enterOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });

    // 中央パルス(ベジェ)
    pulse.value = withRepeat(
      withTiming(1.18, { duration: 900, easing: SLIDE_UP_BEZIER }),
      -1,
      true,
    );

    // スパークル(4 秒で 1 周)
    sparkleRotate.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false,
    );

    // 白スピナーリング(1.2 秒で 1 周、Web 版 simpleSpin に近い)
    ringRotate.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
  }, [enterTranslate, enterOpacity, pulse, sparkleRotate, ringRotate]);

  useEffect(() => {
    const id = setInterval(() => {
      messageOpacity.value = withTiming(0, { duration: 250 });
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % messages.length);
        messageOpacity.value = withTiming(1, { duration: 400 });
      }, 280);
    }, 2500);
    return () => clearInterval(id);
  }, [messages.length, messageOpacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: enterOpacity.value,
    transform: [{ translateY: enterTranslate.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotate.value}deg` }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotate.value}deg` }],
  }));
  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

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
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
      }}
    >
      <Animated.View style={[{ alignItems: 'center' }, containerStyle]}>
        <View
          style={{
            width: 260,
            height: 260,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 外周: スパークル(ゆっくり回転) */}
          <Animated.View
            style={[
              { position: 'absolute', width: 260, height: 260 },
              sparkleStyle,
            ]}
          >
            {SPARKLE_POSITIONS.map((pos, i) => (
              <Text
                key={i}
                style={{ position: 'absolute', fontSize: 32, ...pos }}
              >
                ✨
              </Text>
            ))}
          </Animated.View>

          {/* 中周: 白いスピナーリング(高速回転、Web版 simpleSpin 相当) */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                borderWidth: 4,
                borderColor: 'rgba(255, 255, 255, 0.15)',
                borderTopColor: 'white',
              },
              ringStyle,
            ]}
          />

          {/* 中央: アクセント円 + 絵文字(パルス) */}
          <Animated.View style={pulseStyle}>
            <View
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: accent,
                shadowOpacity: 0.7,
                shadowRadius: 24,
                shadowOffset: { width: 0, height: 0 },
                elevation: 16,
              }}
            >
              <Text style={{ fontSize: 80 }}>{emoji}</Text>
            </View>
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            {
              marginTop: 36,
              color: 'white',
              fontSize: 18,
              textAlign: 'center',
              paddingHorizontal: 40,
              lineHeight: 28,
            },
            messageStyle,
          ]}
          className="font-rounded-bold"
        >
          {messages[msgIdx]}
        </Animated.Text>
      </Animated.View>
    </View>
  );
}
