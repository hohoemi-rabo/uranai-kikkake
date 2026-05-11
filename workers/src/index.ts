import { AuthError, maskSub, verifyToken, type Provider } from './auth';

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
      let body: { provider?: unknown };
      try {
        body = (await req.json()) as { provider?: unknown };
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

      return jsonResponse(
        {
          status: 'ok',
          message: 'skeleton',
          endpoint: '/api/divine',
        },
        { headers: cors },
      );
    }

    return jsonResponse({ error: 'NOT_FOUND' }, { status: 404, headers: cors });
  },
} satisfies ExportedHandler<Env>;
