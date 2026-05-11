import { PROMPTS, RESULT_SCHEMA, type Mode } from './prompts';
import type { Env } from './index';

const MODEL = 'gemini-3-flash-preview';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const RETRY_DELAYS_MS = [500, 1000, 2000, 4000, 8000];
const REQUEST_TIMEOUT_MS = 30_000;

export type DivineResult = {
  title: string;
  animal: string;
  personality: string;
  luckyItem: string;
  advice: string;
  score?: number;
  icebreaker: string;
};

export class GeminiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: 'misconfig' | 'failed' = 'failed',
  ) {
    super(message);
  }
}

class GeminiHttpError extends Error {
  constructor(
    public httpStatus: number,
    public detail: string,
  ) {
    super(`HTTP ${httpStatus}: ${detail}`);
  }
}

function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

async function callOnce(apiKey: string, mode: Mode, imageBase64: string): Promise<DivineResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: PROMPTS[mode] },
            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESULT_SCHEMA,
      },
    };

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 200);
      throw new GeminiHttpError(res.status, detail);
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new GeminiError('NO_TEXT', 'Gemini response missing text content');
    }
    return JSON.parse(text) as DivineResult;
  } finally {
    clearTimeout(timer);
  }
}

export async function callGemini(
  env: Env,
  mode: Mode,
  imageBase64: string,
): Promise<DivineResult> {
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiError('SERVER_MISCONFIG', 'GEMINI_API_KEY is not configured', 'misconfig');
  }

  let lastErr: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
      console.log(`gemini retry attempt=${attempt} mode=${mode}`);
    }
    try {
      return await callOnce(apiKey, mode, imageBase64);
    } catch (e) {
      lastErr = e;
      if (e instanceof GeminiHttpError && !shouldRetry(e.httpStatus)) {
        throw new GeminiError('GEMINI_4XX', `Gemini returned ${e.httpStatus}`);
      }
      if (e instanceof GeminiError) {
        throw e;
      }
      // 5xx / 429 / network / abort → ループ続行
    }
  }
  if (lastErr instanceof GeminiHttpError) {
    throw new GeminiError(
      'GEMINI_RETRIES_EXHAUSTED',
      `Gemini failed after retries: HTTP ${lastErr.httpStatus}`,
    );
  }
  throw new GeminiError(
    'GEMINI_RETRIES_EXHAUSTED',
    `Gemini failed after retries: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
  );
}
