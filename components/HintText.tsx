import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { TabAccent, type TabKey } from '@/constants/theme';

type Props = {
  tab: TabKey;
};

export function HintText({ tab }: Props) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.35, { duration: 900 }), -1, true);
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text
      style={[{ color: TabAccent[tab] }, animStyle]}
      className="text-center text-lg font-rounded-bold"
    >
      タップしてはじめよう
    </Animated.Text>
  );
}
