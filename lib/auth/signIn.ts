import { signInStub } from './stub';
import type { AuthSession, Provider } from './types';

const ENV_MODE = process.env.EXPO_PUBLIC_AUTH_MODE as Provider | undefined;
const DEFAULT_MODE: Provider = ENV_MODE ?? 'stub';

export async function signIn(provider: Provider = DEFAULT_MODE): Promise<AuthSession> {
  if (provider === 'stub') return signInStub();
  if (provider === 'google') {
    throw new Error(
      'Google サインインは `useGoogleSignIn` Hook 経由で行ってください(`app/(auth)/login.tsx` 参照)',
    );
  }
  if (provider === 'apple') {
    throw new Error('Apple sign-in is phase 2 (ticket 05)');
  }
  throw new Error(`Unsupported provider: ${provider as string}`);
}
