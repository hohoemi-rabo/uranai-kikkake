import { Pressable, Text, View } from 'react-native';

import type { TabKey } from '@/constants/theme';

const TABS: { key: TabKey; emoji: string; label: string; bgClass: string }[] = [
  { key: 'charm', emoji: '🌟', label: '魅力発見', bgClass: 'bg-charm' },
  { key: 'palm', emoji: '✋', label: '手相', bgClass: 'bg-palm' },
  { key: 'match', emoji: '💖', label: '相性', bgClass: 'bg-match' },
];

type Props = {
  value: TabKey;
  onChange: (next: TabKey) => void;
};

export function TabSwitcher({ value, onChange }: Props) {
  return (
    <View className="flex-row gap-3">
      {TABS.map((t) => {
        const selected = t.key === value;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            className={`flex-1 p-4 rounded-2xl active:opacity-80 ${
              selected ? t.bgClass : 'bg-white'
            }`}
          >
            <Text className="text-center text-3xl">{t.emoji}</Text>
            <Text
              className={`text-center mt-1 text-base font-rounded-bold ${
                selected ? 'text-white' : 'text-slate-700'
              }`}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
