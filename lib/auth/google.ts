import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

import type { AuthSession } from './types';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
const REDIRECT_URI =
  'https://hohoemi-rabo.github.io/uranai-kikkake/oauth/redirect.html';
const APP_CALLBACK_URL = 'uranaikikkake://oauth/google/callback';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

// PKCE 検証値と state は SecureStore に永続化する。
// module 変数だと、OAuth 中(Custom Tabs 表示中)に Android がアプリを kill した場合
// — 低メモリの古い端末で起こりうる — に失われ、callback で no-pending になってしまう。
const PKCE_STORE_KEY = 'oauth_pkce_pending';

// 同一プロセス内での completeGoogleSignIn 二重実行ガード。
// callback 画面は「OS の deep link 配信」と「startGoogleSignIn の router.replace」の
// 両方でマウントされうる(端末依存)。認可コードは 1 回限り有効なので、2 回目の
// トークン交換は必ず invalid_grant で失敗する。最初の Promise を共有して交換を 1 回に抑える。
// startGoogleSignIn で新フロー開始時に null にリセットする。
let inFlightCompletion: Promise<GoogleSignInOutcome> | null = null;

function decodeJwtPayload(jwt: string): {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
} | null {
  try {
    const [, payloadB64] = jwt.split('.');
    if (!payloadB64) return null;
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(pad);
    return JSON.parse(globalThis.atob(padded)) as {
      sub?: string;
      name?: string;
      email?: string;
      picture?: string;
    };
  } catch {
    return null;
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return globalThis
    .btoa(bin)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function sha256Base64Url(input: string): Promise<string> {
  const b64 = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export type GoogleSignInOutcome =
  | { ok: true; session: AuthSession }
  | { ok: false; reason: 'cancelled' | 'no-pending' | 'state-mismatch' | 'error'; message?: string };

/**
 * Google OAuth フローを開始する。Custom Tabs で Google の認可画面を開く。
 * 認可成功時は GitHub Pages の redirect.html 経由で `uranaikikkake://oauth/google/callback` に戻り、
 * expo-router が `app/oauth/google/callback.tsx` 画面をルーティング、そこで `completeGoogleSignIn` を呼ぶ。
 *
 * このメソッド自体は **OAuth セッションを開く役** で、認証完了の Promise ではない。
 * 認証完了は callback 画面の中で `signInWithSession` を呼ぶことで反映される。
 */
export async function startGoogleSignIn(): Promise<void> {
  if (!WEB_CLIENT_ID) {
    throw new Error('GOOGLE_WEB_CLIENT_ID が未設定です');
  }

  // 新しいフローを開始するので、前回の完了結果(再ログイン時の古い Promise)をリセット
  inFlightCompletion = null;

  // PKCE と state を生成して SecureStore に保持(callback 画面で照合する)
  const verifierBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = bytesToBase64Url(verifierBytes);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const stateBytes = await Crypto.getRandomBytesAsync(16);
  const state = bytesToBase64Url(stateBytes);

  await SecureStore.setItemAsync(
    PKCE_STORE_KEY,
    JSON.stringify({ codeVerifier, state }),
  );

  const authUrl =
    GOOGLE_AUTH_ENDPOINT +
    '?' +
    new URLSearchParams({
      client_id: WEB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      prompt: 'select_account',
    }).toString();

  // 通常は GH Pages の JS が `uranaikikkake://...` に遷移 → OS が deep link 配信 →
  // expo-router が callback 画面をルーティングする(result.type は 'dismiss')。
  // 一部端末では Custom Tabs 側がリダイレクトを横取りして result.type === 'success' になり、
  // その場合は OS の deep link 配信が起きず callback 画面が起動しない。
  // → 戻り値が success のときは、ここで明示的に callback ルートへ流して経路を統一する。
  const result = await WebBrowser.openAuthSessionAsync(authUrl, APP_CALLBACK_URL);
  if (result.type === 'success' && result.url) {
    const queryIndex = result.url.indexOf('?');
    const search = new URLSearchParams(
      queryIndex >= 0 ? result.url.slice(queryIndex + 1) : '',
    );
    const params: Record<string, string> = {};
    for (const key of ['code', 'state', 'error'] as const) {
      const v = search.get(key);
      if (v) params[key] = v;
    }
    router.replace({ pathname: '/oauth/google/callback', params });
  }
}

/**
 * Callback 画面から呼ばれる。クエリパラメータの code/state を検証してトークン交換する。
 *
 * callback 画面が二重マウントされても、同一プロセス内なら最初の Promise を共有する
 * (`inFlightCompletion`)。実体は `runCompleteGoogleSignIn`。
 */
export function completeGoogleSignIn(params: {
  code?: string;
  state?: string;
  error?: string;
}): Promise<GoogleSignInOutcome> {
  if (inFlightCompletion) {
    return inFlightCompletion;
  }
  inFlightCompletion = runCompleteGoogleSignIn(params);
  return inFlightCompletion;
}

async function runCompleteGoogleSignIn(params: {
  code?: string;
  state?: string;
  error?: string;
}): Promise<GoogleSignInOutcome> {
  // SecureStore から PKCE 検証値を取り出す。1 回しか消費できないよう、読み出し直後に削除する。
  let pending: { codeVerifier: string; state: string } | null = null;
  try {
    const raw = await SecureStore.getItemAsync(PKCE_STORE_KEY);
    if (raw) {
      await SecureStore.deleteItemAsync(PKCE_STORE_KEY);
      pending = JSON.parse(raw) as { codeVerifier: string; state: string };
    }
  } catch {
    pending = null;
  }

  if (!pending) {
    return {
      ok: false,
      reason: 'no-pending',
      message: '保留中の OAuth フローがありません',
    };
  }
  const { codeVerifier, state } = pending;

  if (params.error) {
    return { ok: false, reason: 'error', message: 'OAuth エラー: ' + params.error };
  }
  if (params.state !== state) {
    return { ok: false, reason: 'state-mismatch', message: 'state が一致しません' };
  }
  if (!params.code) {
    return { ok: false, reason: 'error', message: '認可コードが取得できません' };
  }

  try {
    // トークン交換は Workers 側で行う。「ウェブアプリケーション」型 OAuth クライアントは
    // confidential client で client_secret が必須だが、それは機密なのでアプリには持たせず
    // Workers の secret に置く。アプリは code/code_verifier/clientId だけを Workers に渡す。
    const tokenRes = await fetch(`${API_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: params.code,
        codeVerifier,
        clientId: WEB_CLIENT_ID,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return {
        ok: false,
        reason: 'error',
        message: 'トークン取得失敗: ' + errText.slice(0, 200),
      };
    }

    const tokens = (await tokenRes.json()) as { idToken?: string };
    if (!tokens.idToken) {
      return { ok: false, reason: 'error', message: 'id_token が応答に含まれません' };
    }

    const payload = decodeJwtPayload(tokens.idToken);
    if (!payload?.sub) {
      return { ok: false, reason: 'error', message: 'id_token に sub がありません' };
    }

    return {
      ok: true,
      session: {
        idToken: tokens.idToken,
        provider: 'google',
        sub: payload.sub,
        name: payload.name,
        email: payload.email,
        pictureUrl: payload.picture,
      },
    };
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
