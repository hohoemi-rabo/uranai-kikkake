import * as SecureStore from 'expo-secure-store';

import type { AuthSession, Provider } from './types';

const KEYS = {
  idToken: 'idToken',
  provider: 'provider',
  sub: 'sub',
} as const;

export async function loadSession(): Promise<AuthSession | null> {
  const [idToken, provider, sub] = await Promise.all([
    SecureStore.getItemAsync(KEYS.idToken),
    SecureStore.getItemAsync(KEYS.provider),
    SecureStore.getItemAsync(KEYS.sub),
  ]);
  if (!idToken || !provider || !sub) return null;
  return { idToken, provider: provider as Provider, sub };
}

export async function saveSession(session: AuthSession): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.idToken, session.idToken),
    SecureStore.setItemAsync(KEYS.provider, session.provider),
    SecureStore.setItemAsync(KEYS.sub, session.sub),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.idToken),
    SecureStore.deleteItemAsync(KEYS.provider),
    SecureStore.deleteItemAsync(KEYS.sub),
  ]);
}
