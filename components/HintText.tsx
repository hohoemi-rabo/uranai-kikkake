import { Text } from 'react-native';

import { TabAccent, type TabKey } from '@/constants/theme';

type Props = {
  tab: TabKey;
};

const DESCRIPTIONS: Record<TabKey, string> = {
  charm: 'あなたの魅力を見つけて\n会話のキッカケに',
  palm: '手のひらから今日の運勢を占います',
  match: 'ふたりの相性をスコアで診断します',
};

export function HintText({ tab }: Props) {
  return (
    <Text
      style={{ color: TabAccent[tab] }}
      className="text-center text-lg font-rounded-bold"
    >
      {DESCRIPTIONS[tab]}
    </Text>
  );
}
