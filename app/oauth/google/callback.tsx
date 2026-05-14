import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { completeGoogleSignIn } from '@/lib/auth/google';

export default function GoogleCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
  }>();
  const { signInWithSession } = useAuth();

  // completeGoogleSignIn は pendingPkce を 1 回しか消費できない。
  // effect が再実行されると 2 回目は no-pending を返してログイン画面に弾かれるため、
  // useRef のフラグで「1 回限り実行」を保証する。
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    (async () => {
      const outcome = await completeGoogleSignIn({
        code: typeof params.code === 'string' ? params.code : undefined,
        state: typeof params.state === 'string' ? params.state : undefined,
        error: typeof params.error === 'string' ? params.error : undefined,
      });

      if (outcome.ok) {
        await signInWithSession(outcome.session);
        router.replace('/(main)');
        return;
      }

      if (outcome.reason !== 'cancelled' && outcome.reason !== 'no-pending') {
        Alert.alert('ログインに失敗しました', outcome.message ?? 'もう一度お試しください');
      }
      router.replace('/(auth)/login');
    })();
  }, [params.code, params.state, params.error, router, signInWithSession]);

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
      }}
    >
      <ActivityIndicator size="large" color={Colors.charm} />
      <Text
        className="mt-4 text-base font-rounded text-slate-700"
      >
        ログイン処理中…
      </Text>
    </View>
  );
}
