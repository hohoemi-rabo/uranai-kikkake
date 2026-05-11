import { createRemoteJWKSet, errors as joseErrors, jwtVerify } from 'jose';

import type { Env } from './index';

export type Provider = 'stub' | 'google' | 'apple';

export type VerifiedAuth = {
  provider: Provider;
  sub: string;
};

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: 401 | 500 = 401,
  ) {
    super(message);
  }
}

const googleJwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const appleJwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));

export async function verifyToken(args: {
  provider: Provider;
  idToken: string | null;
  devSubHeader: string | null;
  env: Env;
}): Promise<VerifiedAuth> {
  const { provider, idToken, devSubHeader, env } = args;

  if (!idToken) {
    throw new AuthError('MISSING_TOKEN', 'Authorization header is missing or malformed');
  }

  if (provider === 'stub') return verifyStub(idToken, devSubHeader, env);
  if (provider === 'google') return verifyGoogle(idToken, env);
  if (provider === 'apple') return verifyApple(idToken, env);
  throw new AuthError('UNSUPPORTED_PROVIDER', `Unsupported provider: ${provider as string}`);
}

function verifyStub(idToken: string, devSubHeader: string | null, env: Env): VerifiedAuth {
  if (env.DEV_BYPASS_ENABLED !== 'true') {
    throw new AuthError('STUB_NOT_ALLOWED', 'Stub auth is disabled in this environment');
  }
  if (!idToken.startsWith('dev-stub-token-')) {
    throw new AuthError('INVALID_STUB_TOKEN', 'Stub token format is invalid');
  }
  if (!devSubHeader) {
    throw new AuthError('MISSING_DEV_SUB', 'X-Dev-Sub header is required for stub auth');
  }
  return { provider: 'stub', sub: devSubHeader };
}

async function verifyGoogle(idToken: string, env: Env): Promise<VerifiedAuth> {
  const audience = (env.GOOGLE_CLIENT_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (audience.length === 0) {
    throw new AuthError('SERVER_MISCONFIG', 'GOOGLE_CLIENT_IDS is not configured', 500);
  }
  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      audience,
    });
    if (!payload.sub) throw new AuthError('NO_SUB', 'Token has no sub claim');
    return { provider: 'google', sub: payload.sub };
  } catch (e) {
    if (e instanceof AuthError) throw e;
    if (e instanceof joseErrors.JOSEError) {
      throw new AuthError('INVALID_GOOGLE_TOKEN', `Google token verification failed: ${e.code}`);
    }
    throw new AuthError('VERIFICATION_FAILED', 'Token verification failed');
  }
}

async function verifyApple(idToken: string, env: Env): Promise<VerifiedAuth> {
  const audience = env.APPLE_BUNDLE_ID?.trim();
  if (!audience) {
    throw new AuthError('SERVER_MISCONFIG', 'APPLE_BUNDLE_ID is not configured', 500);
  }
  try {
    const { payload } = await jwtVerify(idToken, appleJwks, {
      issuer: 'https://appleid.apple.com',
      audience,
    });
    if (!payload.sub) throw new AuthError('NO_SUB', 'Token has no sub claim');
    return { provider: 'apple', sub: payload.sub };
  } catch (e) {
    if (e instanceof AuthError) throw e;
    if (e instanceof joseErrors.JOSEError) {
      throw new AuthError('INVALID_APPLE_TOKEN', `Apple token verification failed: ${e.code}`);
    }
    throw new AuthError('VERIFICATION_FAILED', 'Token verification failed');
  }
}

export function maskSub(sub: string): string {
  return sub.slice(0, 4) + '****';
}
