import { useEffect, useState } from 'react';
import { Text, type TextStyle } from 'react-native';

type Props = {
  text: string;
  intervalMs?: number;
  startDelayMs?: number;
  className?: string;
  style?: TextStyle;
};

export function TypewriterText({
  text,
  intervalMs = 35,
  startDelayMs = 0,
  className,
  style,
}: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setCount((prev) => {
          if (prev >= text.length) {
            if (intervalId) clearInterval(intervalId);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    }, startDelayMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, intervalMs, startDelayMs]);

  return (
    <Text className={className} style={style}>
      {text.slice(0, count)}
    </Text>
  );
}
