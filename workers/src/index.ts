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
