import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { AuthSession } from './types';

const SUB_KEY = 'auth_stub_sub';

async function getOrCreateStubSub(): Promise<string> {
  const cached = await AsyncStorage.getItem(SUB_KEY);
  if (cached) return cached;
  const generated = Crypto.randomUUID();
  await AsyncStorage.setItem(SUB_KEY, generated);
  return generated;
}

export async function signInStub(): Promise<AuthSession> {
  const sub = await getOrCreateStubSub();
  return {
    idToken: `dev-stub-token-${Date.now()}`,
    provider: 'stub',
    sub,
  };
}
