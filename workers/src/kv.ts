import type { Provider } from './auth';
import type { Env } from './index';

export const MAX_PER_DAY = 3;
export const USAGE_TTL_SECONDS = 60 * 60 * 48;

export type UsageRecord = {
  count: number;
  lastUsedAt: string;
};

export function getJstDate(now: number = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function nextJstMidnightIso(now: number = Date.now()): string {
  const today = getJstDate(now);
  const tomorrow = new Date(`${today}T00:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const y = tomorrow.getUTCFullYear();
  const m = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}T00:00:00+09:00`;
}

function nowJstIso(now: number = Date.now()): string {
  const shifted = new Date(now + 9 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  const hh = String(shifted.getUTCHours()).padStart(2, '0');
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0');
  const ss = String(shifted.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}+09:00`;
}

function buildKey(provider: Provider, sub: string, date: string): string {
  return `usage:${provider}:${sub}:${date}`;
}

export async function getUsage(env: Env, provider: Provider, sub: string): Promise<UsageRecord> {
  const key = buildKey(provider, sub, getJstDate());
  const raw = await env.USAGE_KV.get(key);
  if (!raw) return { count: 0, lastUsedAt: '' };
  try {
    const parsed = JSON.parse(raw) as UsageRecord;
    if (typeof parsed.count === 'number') return parsed;
  } catch {
    // 破損データは 0 として扱う
  }
  return { count: 0, lastUsedAt: '' };
}

export async function incrementUsage(
  env: Env,
  provider: Provider,
  sub: string,
  current: UsageRecord,
): Promise<UsageRecord> {
  const key = buildKey(provider, sub, getJstDate());
  const next: UsageRecord = {
    count: current.count + 1,
    lastUsedAt: nowJstIso(),
  };
  await env.USAGE_KV.put(key, JSON.stringify(next), { expirationTtl: USAGE_TTL_SECONDS });
  return next;
}
