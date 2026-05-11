import type { AuthSession } from './auth/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

let on401Handler: (() => Promise<void>) | null = null;

export function registerOn401(handler: () => Promise<void>): void {
  on401Handler = handler;
}

export type ApiOptions = Omit<RequestInit, 'headers'> & {
  session: AuthSession;
  headers?: Record<string, string>;
};

export async function apiFetch(path: string, options: ApiOptions): Promise<Response> {
  const { session, headers, ...rest } = options;
  const merged: Record<string, string> = {
    Authorization: `Bearer ${session.idToken}`,
    ...(headers ?? {}),
  };
  if (session.provider === 'stub') {
    merged['X-Dev-Sub'] = session.sub;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers: merged });
  if (res.status === 401 && on401Handler) {
    await on401Handler();
  }
  return res;
}
