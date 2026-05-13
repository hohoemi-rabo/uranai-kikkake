import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

import type { AuthSession } from './types';

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const REDIRECT_URI =
  'https://hohoemi-rabo.github.io/uranai-kikkake/oauth/redirect.html';
const APP_CALLBACK_URL = 'uranaikikkake://oauth/google/callback';

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// OAuth フロー開始から callback 画面に渡るまで PKCE 検証値と state を保持する
let pendingPkce: { codeVerifier: string; state: string } | null = null;

function decodeJwtPayload(jwt: string): { sub?: string } | null {
  try {
    const [, payloadB64] = jwt.split('.');
    if (!payloadB64) return null;
    const normalized = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(pad);
    return JSON.parse(globalThis.atob(padded)) as { sub?: string };
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

  // PKCE と state を生成して保持(callback 画面で照合する)
  const verifierBytes = await Crypto.getRandomBytesAsync(32);
  const codeVerifier = bytesToBase64Url(verifierBytes);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const stateBytes = await Crypto.getRandomBytesAsync(16);
  const state = bytesToBase64Url(stateBytes);

  pendingPkce = { codeVerifier, state };

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

  // openAuthSessionAsync は Custom Tabs を開き、Browser dismiss で Promise resolve する。
  // 我々のフローでは GH Pages の JS が `uranaikikkake://...` に遷移し、
  // OS が deep link としてアプリに配信 → expo-router が callback 画面に到達する流れ。
  // openAuthSessionAsync 側は dismiss と認識されて resolve するので、戻り値の type は気にしない。
  await WebBrowser.openAuthSessionAsync(authUrl, APP_CALLBACK_URL);
}

/**
 * Callback 画面から呼ばれる。クエリパラメータの code/state を検証してトークン交換する。
 */
export async function completeGoogleSignIn(params: {
  code?: string;
  state?: string;
  error?: string;
}): Promise<GoogleSignInOutcome> {
  if (!pendingPkce) {
    return {
      ok: false,
      reason: 'no-pending',
      message: '保留中の OAuth フローがありません',
    };
  }
  const { codeVerifier, state } = pendingPkce;
  pendingPkce = null;

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
    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: WEB_CLIENT_ID,
        code: params.code,
        code_verifier: codeVerifier,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return {
        ok: false,
        reason: 'error',
        message: 'トークン取得失敗: ' + errText.slice(0, 200),
      };
    }

    const tokens = (await tokenRes.json()) as { id_token?: string };
    if (!tokens.id_token) {
      return { ok: false, reason: 'error', message: 'id_token が応答に含まれません' };
    }

    const payload = decodeJwtPayload(tokens.id_token);
    if (!payload?.sub) {
      return { ok: false, reason: 'error', message: 'id_token に sub がありません' };
    }

    return {
      ok: true,
      session: { idToken: tokens.id_token, provider: 'google', sub: payload.sub },
    };
  } catch (e) {
    return {
      ok: false,
      reason: 'error',
      message: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
