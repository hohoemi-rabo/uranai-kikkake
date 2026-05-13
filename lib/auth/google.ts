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

function parseQuery(url: string): URLSearchParams {
  const q = url.indexOf('?');
  if (q === -1) return new URLSearchParams();
  return new URLSearchParams(url.slice(q + 1));
}

export type GoogleSignInOutcome =
  | { ok: true; session: AuthSession }
  | { ok: false; reason: 'cancelled' | 'error'; message?: string };

export async function signInWithGoogle(): Promise<GoogleSignInOutcome> {
  if (!WEB_CLIENT_ID) {
    return {
      ok: false,
      reason: 'error',
      message: 'GOOGLE_WEB_CLIENT_ID が未設定です',
    };
  }

  try {
    // PKCE と state を生成
    const verifierBytes = await Crypto.getRandomBytesAsync(32);
    const codeVerifier = bytesToBase64Url(verifierBytes);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const stateBytes = await Crypto.getRandomBytesAsync(16);
    const state = bytesToBase64Url(stateBytes);

    // Google OAuth 認可エンドポイントへ
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

    // Custom Tabs で開いて、custom scheme にリダイレクトされるのを待つ
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      APP_CALLBACK_URL,
    );

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, reason: 'cancelled' };
    }
    if (result.type !== 'success') {
      return { ok: false, reason: 'error', message: 'OAuth セッションが失敗しました' };
    }

    // コールバック URL のクエリ部分を解析
    const search = parseQuery(result.url);
    const errorParam = search.get('error');
    if (errorParam) {
      return { ok: false, reason: 'error', message: 'OAuth エラー: ' + errorParam };
    }
    const returnedState = search.get('state');
    if (returnedState !== state) {
      return { ok: false, reason: 'error', message: 'state が一致しません' };
    }
    const code = search.get('code');
    if (!code) {
      return { ok: false, reason: 'error', message: '認可コードが取得できません' };
    }

    // 認可コード → トークン交換(PKCE 検証つき、client_secret 不要)
    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: WEB_CLIENT_ID,
        code,
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
