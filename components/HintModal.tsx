import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Colors, type TabKey } from '@/constants/theme';

type HintConfig = {
  emoji: string;
  title: string;
  hints: string[];
};

const HINT_CONFIG: Record<TabKey, HintConfig> = {
  charm: {
    emoji: '✨',
    title: 'こんな写真もおすすめ',
    hints: [
      '笑顔の写真がおすすめ',
      'ご家族、お孫さん、お友達でも',
      'ウチの子(ペット)も…?',
      'お気に入りのぬいぐるみさんも、素敵な魅力が見つかるかも',
    ],
  },
  palm: {
    emoji: '✋',
    title: '手相撮影のコツ',
    hints: [
      '手のひらを大きく開いて撮ってください',
      '線がうっすらでも大丈夫',
      '明るい場所だとよく見えます',
      'ご家族の手相も、占ってみては',
    ],
  },
  match: {
    emoji: '💖',
    title: 'こんな写真もおすすめ',
    hints: [
      'お二人並んだ写真がおすすめ',
      'ご家族との一枚、お友達同士でも',
      'もしかしたら、ペットと飼い主さんも…?',
      '大切なご縁を、ぜひ診断してみてください',
    ],
  },
};

const SLIDE_UP_BEZIER = Easing.bezier(0.23, 1, 0.32, 1);

type Props = {
  visible: boolean;
  mode: TabKey;
  onClose: () => void;
};

export function HintModal({ visible, mode, onClose }: Props) {
  const { emoji, title, hints } = HINT_CONFIG[mode];
  const accent = Colors[mode];

  const cardTranslateY = useSharedValue(40);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      cardTranslateY.value = 40;
      cardOpacity.value = 0;
      cardTranslateY.value = withTiming(0, {
        duration: 380,
        easing: SLIDE_UP_BEZIER,
      });
      cardOpacity.value = withTiming(1, {
        duration: 380,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [visible, cardTranslateY, cardOpacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 380,
              backgroundColor: 'white',
              borderRadius: 28,
              padding: 24,
              paddingTop: 56,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 8 },
              elevation: 12,
            },
            cardStyle,
          ]}
        >
          {/* 中央上に絵文字バッジ(浮かせる) */}
          <View
            style={{
              position: 'absolute',
              top: -36,
              left: 0,
              right: 0,
              alignItems: 'center',
            }}
            pointerEvents="none"
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: accent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: accent,
                shadowOpacity: 0.5,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
                elevation: 10,
              }}
            >
              <Text style={{ fontSize: 36 }}>{emoji}</Text>
            </View>
          </View>

          {/* タイトル */}
          <Text
            className="text-center text-xl font-rounded-bold mb-5"
            style={{ color: accent }}
          >
            {title}
          </Text>

          {/* ヒント箇条書き */}
          <View style={{ gap: 14, marginBottom: 24 }}>
            {hints.map((hint, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'flex-start' }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: accent,
                    marginTop: 9,
                    marginRight: 12,
                  }}
                />
                <Text
                  className="flex-1 text-base font-rounded text-slate-700"
                  style={{ lineHeight: 26 }}
                >
                  {hint}
                </Text>
              </View>
            ))}
          </View>

          {/* 閉じるボタン */}
          <Pressable
            onPress={onClose}
            className="p-4 rounded-2xl active:opacity-80"
            style={{ backgroundColor: accent }}
          >
            <Text className="text-center text-lg font-rounded-bold text-white">
              閉じる
            </Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
