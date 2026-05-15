import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { BackgroundGradient } from '@/constants/theme';

type Props = {
  children: ReactNode;
  edges?: readonly Edge[];
  style?: ViewStyle;
};

export function ScreenBackground({ children, edges, style }: Props) {
  return (
    <LinearGradient
      colors={BackgroundGradient.colors}
      start={BackgroundGradient.start}
      end={BackgroundGradient.end}
      style={{ flex: 1 }}
    >
      <SafeAreaView
        style={[{ flex: 1, backgroundColor: 'transparent' }, style]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}
