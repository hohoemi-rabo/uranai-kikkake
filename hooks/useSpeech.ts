import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

const SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: 'ja-JP',
  rate: 1.0,
  pitch: 1.0,
};

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  function speak(parts: string[]) {
    const filtered = parts.filter((p) => typeof p === 'string' && p.trim().length > 0);
    if (filtered.length === 0) return;

    Speech.stop();
    setIsSpeaking(true);

    filtered.forEach((part, i) => {
      const isLast = i === filtered.length - 1;
      Speech.speak(part, {
        ...SPEECH_OPTIONS,
        onDone: isLast ? () => setIsSpeaking(false) : undefined,
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    });
  }

  function stop() {
    Speech.stop();
    setIsSpeaking(false);
  }

  return { speak, stop, isSpeaking };
}
