import { apiFetch } from '@/lib/api';

import { useAuth } from './useAuth';
import { useUsage } from './useUsage';

export type Mode = 'charm' | 'palm' | 'match';

export type DivineResultBody = {
  title: string;
  animal: string;
  personality: string;
  luckyItem: string;
  advice: string;
  score?: number;
  icebreaker: string;
};

export type DivineUsage = { today: number; max: number };

export type DivineOutcome =
  | { ok: true; result: DivineResultBody; usage: DivineUsage }
  | { ok: false; kind: 'rate-limit'; resetAt: string }
  | { ok: false; kind: 'gemini-failed' }
  | { ok: false; kind: 'unauthorized' }
  | { ok: false; kind: 'network' }
  | { ok: false; kind: 'other'; message: string };

export function useDivine() {
  const { session } = useAuth();
  const { updateUsage } = useUsage();

  async function divine(mode: Mode, imageBase64: string): Promise<DivineOutcome> {
    if (!session) return { ok: false, kind: 'unauthorized' };

    let res: Response;
    try {
      res = await apiFetch('/api/divine', {
        session,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: session.provider, mode, imageBase64 }),
      });
    } catch (e) {
      console.error('divine network error:', e);
      return { ok: false, kind: 'network' };
    }

    if (res.status === 401) return { ok: false, kind: 'unauthorized' };

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return { ok: false, kind: 'other', message: `unexpected response (${res.status})` };
    }

    if (res.status === 429) {
      const d = data as { resetAt?: string };
      return { ok: false, kind: 'rate-limit', resetAt: d.resetAt ?? '' };
    }
    if (res.status === 502) return { ok: false, kind: 'gemini-failed' };

    if (!res.ok) {
      const d = data as { message?: string; error?: string };
      return { ok: false, kind: 'other', message: d.message ?? d.error ?? `HTTP ${res.status}` };
    }

    const d = data as { result?: DivineResultBody; usage?: DivineUsage };
    if (!d.result || !d.usage) {
      return { ok: false, kind: 'other', message: 'invalid response body' };
    }

    await updateUsage(d.usage);
    return { ok: true, result: d.result, usage: d.usage };
  }

  return { divine };
}
