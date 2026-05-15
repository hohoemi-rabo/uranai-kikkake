import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import type { AuthSession } from '@/lib/auth/types';

type Props = {
  session: AuthSession | null;
  size?: number;
};

function getInitial(session: AuthSession | null): string {
  if (!session) return '?';
  if (session.provider === 'stub') return '開';
  if (session.name && session.name.length > 0) return session.name[0]!;
  if (session.email && session.email.length > 0) return session.email[0]!.toUpperCase();
  return '?';
}

export function UserAvatar({ session, size = 40 }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  const radius = size / 2;
  const hasImage =
    session?.provider === 'google' && session.pictureUrl && !imageFailed;

  if (hasImage) {
    return (
      <Image
        source={{ uri: session.pictureUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: Colors.card,
        }}
        contentFit="cover"
        onError={() => setImageFailed(true)}
        accessibilityLabel="ユーザーアイコン"
      />
    );
  }

  // stub or Google で画像取得失敗時のフォールバック(イニシャル円)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: Colors.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityLabel="ユーザーアイコン"
    >
      <Text
        style={{
          fontSize: size * 0.45,
          fontWeight: '700',
          color: Colors.textPrimary,
        }}
      >
        {getInitial(session)}
      </Text>
    </View>
  );
}
