import { Text, View } from 'react-native';

import { TabAccent, type TabKey } from '@/constants/theme';

const FRAME_HINT: Record<TabKey, string> = {
  charm: 'ここに顔を合わせてね',
  palm: '手のひらを映してね',
  match: '2 人を映してね(または手のひらを並べて)',
};

export function ModeFrameOverlay({ mode }: { mode: TabKey }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
    >
      <View className="flex-1 items-center justify-center">
        {mode === 'charm' && <CharmFrame />}
        {mode === 'palm' && <PalmFrame />}
        {mode === 'match' && <MatchFrame />}
      </View>
      <View className="absolute top-24 left-0 right-0 px-6">
        <Text
          className="text-center text-lg font-rounded-bold text-white"
          style={{
            textShadowColor: 'rgba(0,0,0,0.7)',
            textShadowRadius: 6,
            textShadowOffset: { width: 0, height: 1 },
          }}
        >
          {FRAME_HINT[mode]}
        </Text>
      </View>
    </View>
  );
}

function CharmFrame() {
  return (
    <View
      className="rounded-full"
      style={{ width: 280, height: 280, borderWidth: 4, borderColor: TabAccent.charm }}
    />
  );
}

function PalmFrame() {
  return (
    <View
      className="rounded-3xl"
      style={{ width: 220, height: 360, borderWidth: 4, borderColor: TabAccent.palm }}
    />
  );
}

function MatchFrame() {
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <FrameBox label="1人目" />
      <FrameBox label="2人目" />
    </View>
  );
}

function FrameBox({ label }: { label: string }) {
  return (
    <View
      className="rounded-3xl items-center justify-end pb-3"
      style={{ width: 130, height: 220, borderWidth: 4, borderColor: TabAccent.match }}
    >
      <Text
        className="text-white font-rounded-bold text-base"
        style={{
          textShadowColor: 'rgba(0,0,0,0.7)',
          textShadowRadius: 4,
          textShadowOffset: { width: 0, height: 1 },
        }}
      >
        {label}
      </Text>
    </View>
  );
}
