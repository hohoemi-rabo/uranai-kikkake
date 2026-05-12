import { Image } from 'expo-image';
import { forwardRef } from 'react';
import { Text, View } from 'react-native';

import { Colors, type TabKey } from '@/constants/theme';
import type { DivineResultBody } from '@/hooks/useDivine';

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

type Props = {
  mode: TabKey;
  result: DivineResultBody;
  photoUri: string;
};

export const ResultCard = forwardRef<View, Props>(function ResultCard(
  { mode, result, photoUri },
  ref,
) {
  const accent = Colors[mode];
  const dateLabel = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View
      ref={ref}
      collapsable={false}
      style={{
        width: 1080,
        backgroundColor: Colors.background,
        padding: 48,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Text style={{ fontSize: 36, fontWeight: '700', color: Colors.textPrimary }}>
          占いキッカケ
        </Text>
        <View
          style={{
            backgroundColor: accent,
            paddingHorizontal: 24,
            paddingVertical: 8,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: '#FFFFFF' }}>
            {MODE_LABEL[mode]}
          </Text>
        </View>
      </View>

      <Image
        source={{ uri: photoUri }}
        style={{ width: '100%', aspectRatio: 1, borderRadius: 24, marginBottom: 24 }}
        contentFit="cover"
      />

      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 24,
          padding: 32,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{ flex: 1, fontSize: 44, fontWeight: '700', color: Colors.textPrimary }}
        >
          {result.title}
        </Text>
        {mode === 'match' && typeof result.score === 'number' && (
          <View style={{ marginLeft: 16, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, color: Colors.textMuted }}>スコア</Text>
            <Text style={{ fontSize: 64, fontWeight: '700', color: accent }}>
              {result.score}
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 24,
          padding: 32,
          marginBottom: 16,
          borderLeftWidth: 8,
          borderLeftColor: accent,
        }}
      >
        <Text style={{ fontSize: 22, color: Colors.textMuted, marginBottom: 6 }}>
          似ている動物
        </Text>
        <Text style={{ fontSize: 38, fontWeight: '700', color: Colors.textPrimary }}>
          {result.animal}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: Colors.cardAlt,
          borderRadius: 24,
          padding: 32,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: accent,
            marginBottom: 12,
          }}
        >
          あなたへのメッセージ
        </Text>
        <Text style={{ fontSize: 30, lineHeight: 48, color: Colors.textSecondary }}>
          {result.personality}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: Colors.luckyItem,
          borderRadius: 24,
          padding: 32,
          marginBottom: 16,
          borderLeftWidth: 8,
          borderLeftColor: accent,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: accent,
            marginBottom: 12,
          }}
        >
          {LUCKY_HEADING[mode]}
        </Text>
        <Text style={{ fontSize: 30, lineHeight: 48, color: Colors.textSecondary }}>
          {result.luckyItem}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: Colors.advice,
          borderRadius: 24,
          padding: 32,
          marginBottom: 16,
          borderLeftWidth: 8,
          borderLeftColor: accent,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: accent,
            marginBottom: 12,
          }}
        >
          ひとことアドバイス
        </Text>
        <Text style={{ fontSize: 30, lineHeight: 48, color: Colors.textSecondary }}>
          {result.advice}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: Colors.card,
          borderRadius: 24,
          padding: 32,
          marginBottom: 24,
          borderLeftWidth: 8,
          borderLeftColor: accent,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: accent,
            marginBottom: 12,
          }}
        >
          おすすめの話題
        </Text>
        <Text style={{ fontSize: 30, lineHeight: 48, color: Colors.textSecondary }}>
          {result.icebreaker}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 22, color: Colors.textMuted }}>{dateLabel}</Text>
        <Text style={{ fontSize: 22, color: Colors.textMuted }}>占いキッカケ</Text>
      </View>
    </View>
  );
});
