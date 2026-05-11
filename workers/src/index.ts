import { AuthError, maskSub, verifyToken, type Provider } from './auth';
import { GeminiError, callGemini } from './gemini';
import { MAX_PER_DAY, getUsage, incrementUsage, nextJstMidnightIso } from './kv';
import { isMode } from './prompts';

export interface Env {
  USAGE_KV: KVNamespace;
  ALLOWED_ORIGINS?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_CLIENT_IDS?: string;
  APPLE_BUNDLE_ID?: string;
  DEV_BYPASS_ENABLED?: string;
}

const ALLOWED_METHODS = 'POST, OPTIONS';
const ALLOWED_HEADERS = 'Authorization, Content-Type, X-Dev-Sub';

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && allowed.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    };
  }
  return {};
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
}

function isProvider(v: unknown): v is Provider {
  return v === 'stub' || v === 'google' || v === 'apple';
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin');
    const cors = corsHeaders(origin, env);
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      if (origin && Object.keys(cors).length === 0) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/api/divine' && req.method === 'POST') {
      let body: { provider?: unknown; mode?: unknown; imageBase64?: unknown };
      try {
        body = (await req.json()) as {
          provider?: unknown;
          mode?: unknown;
          imageBase64?: unknown;
        };
      } catch {
        return jsonResponse(
          { error: 'BAD_REQUEST', message: 'Invalid JSON body' },
          { status: 400, headers: cors },
        );
      }

      const provider = body.provider;
      if (!isProvider(provider)) {
        return jsonResponse(
          { error: 'BAD_REQUEST', message: 'provider must be stub | google | apple' },
          { status: 400, headers: cors },
        );
      }

      const mode = body.mode;
      if (!isMode(mode)) {
        return jsonResponse(
          { error: 'BAD_REQUEST', message: 'mode must be charm | palm | match' },
          { status: 400, headers: cors },
        );
      }
      const imageBase64 = body.imageBase64;
      if (typeof imageBase64 !== 'string' || imageBase64.length === 0) {
        return jsonResponse(
          { error: 'BAD_REQUEST', message: 'imageBase64 is required (non-empty string)' },
          { status: 400, headers: cors },
        );
      }

      const authHeader = req.headers.get('Authorization');
      const idToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : null;
      const devSubHeader = req.headers.get('X-Dev-Sub');

      let auth;
      try {
        auth = await verifyToken({ provider, idToken, devSubHeader, env });
      } catch (e) {
        if (e instanceof AuthError) {
          console.log(`auth fail: provider=${provider} code=${e.code}`);
          return jsonResponse(
            { error: e.status === 500 ? 'SERVER_ERROR' : 'UNAUTHORIZED', message: e.message },
            { status: e.status, headers: cors },
          );
        }
        throw e;
      }

      console.log(`auth ok: provider=${auth.provider} sub=${maskSub(auth.sub)}`);

      const usage = await getUsage(env, auth.provider, auth.sub);
      if (usage.count >= MAX_PER_DAY) {
        console.log(
          `rate limit: provider=${auth.provider} sub=${maskSub(auth.sub)} count=${usage.count}`,
        );
        return jsonResponse(
          {
            error: 'RATE_LIMIT_EXCEEDED',
            message: '今日はもう3回占いました。また明日会いましょう!',
            resetAt: nextJstMidnightIso(),
          },
          { status: 429, headers: cors },
        );
      }

      let result;
      try {
        result = await callGemini(env, mode, imageBase64);
      } catch (e) {
        if (e instanceof GeminiError) {
          console.log(`gemini fail: mode=${mode} sub=${maskSub(auth.sub)} code=${e.code}`);
          if (e.status === 'misconfig') {
            return jsonResponse(
              { error: 'SERVER_ERROR', message: e.message },
              { status: 500, headers: cors },
            );
          }
          return jsonResponse(
            { error: 'GEMINI_FAILED', message: 'Failed to generate result. Please try again.' },
            { status: 502, headers: cors },
          );
        }
        throw e;
      }

      const updated = await incrementUsage(env, auth.provider, auth.sub, usage);
      console.log(
        `usage ok: provider=${auth.provider} sub=${maskSub(auth.sub)} mode=${mode} count=${updated.count}/${MAX_PER_DAY}`,
      );

      return jsonResponse(
        { result, usage: { today: updated.count, max: MAX_PER_DAY } },
        { headers: cors },
      );
    }

    return jsonResponse({ error: 'NOT_FOUND' }, { status: 404, headers: cors });
  },
} satisfies ExportedHandler<Env>;
