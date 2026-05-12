import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';

import type { AuthSession } from './types';

WebBrowser.maybeCompleteAuthSession();

function decodeJwtPayload(jwt: string): { sub?: string } | null {
  try {
    const [, payloadB64] = jwt.split('.');
    if (!payloadB64) return null;
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(pad);
    const json = globalThis.atob(padded);
    return JSON.parse(json) as { sub?: string };
  } catch {
    return null;
  }
}

type Callbacks = {
  onSuccess: (session: AuthSession) => void | Promise<void>;
  onCancel?: () => void;
  onError: (message: string) => void;
};

export function useGoogleSignIn({ onSuccess, onCancel, onError }: Callbacks) {
  const [, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
    scopes: ['openid', 'profile'],
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'cancel' || response.type === 'dismiss') {
      onCancel?.();
      return;
    }
    if (response.type === 'error') {
      onError(response.error?.message ?? 'Google サインインに失敗しました');
      return;
    }
    if (response.type === 'success') {
      const idToken = response.params.id_token;
      if (!idToken) {
        onError('Google サインインで id_token を取得できませんでした');
        return;
      }
      const payload = decodeJwtPayload(idToken);
      if (!payload?.sub) {
        onError('id_token に sub が含まれていません');
        return;
      }
      void onSuccess({ idToken, provider: 'google', sub: payload.sub });
    }
  }, [response, onSuccess, onCancel, onError]);

  return { start: () => promptAsync() };
}
