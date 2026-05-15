import * as SecureStore from 'expo-secure-store';

import type { AuthSession, Provider } from './types';

const KEYS = {
  idToken: 'idToken',
  provider: 'provider',
  sub: 'sub',
  name: 'name',
  email: 'email',
  pictureUrl: 'pictureUrl',
} as const;

export async function loadSession(): Promise<AuthSession | null> {
  const [idToken, provider, sub, name, email, pictureUrl] = await Promise.all([
    SecureStore.getItemAsync(KEYS.idToken),
    SecureStore.getItemAsync(KEYS.provider),
    SecureStore.getItemAsync(KEYS.sub),
    SecureStore.getItemAsync(KEYS.name),
    SecureStore.getItemAsync(KEYS.email),
    SecureStore.getItemAsync(KEYS.pictureUrl),
  ]);
  if (!idToken || !provider || !sub) return null;
  return {
    idToken,
    provider: provider as Provider,
    sub,
    name: name ?? undefined,
    email: email ?? undefined,
    pictureUrl: pictureUrl ?? undefined,
  };
}

export async function saveSession(session: AuthSession): Promise<void> {
  const ops: Promise<unknown>[] = [
    SecureStore.setItemAsync(KEYS.idToken, session.idToken),
    SecureStore.setItemAsync(KEYS.provider, session.provider),
    SecureStore.setItemAsync(KEYS.sub, session.sub),
  ];
  // 旧セッションから残った値で「現在のユーザー」のプロフィールが上書きされないよう、
  // 新値が無いキーは消しておく(provider 切替や Google アカウント切替で別人になるケース)
  ops.push(
    session.name
      ? SecureStore.setItemAsync(KEYS.name, session.name)
      : SecureStore.deleteItemAsync(KEYS.name),
  );
  ops.push(
    session.email
      ? SecureStore.setItemAsync(KEYS.email, session.email)
      : SecureStore.deleteItemAsync(KEYS.email),
  );
  ops.push(
    session.pictureUrl
      ? SecureStore.setItemAsync(KEYS.pictureUrl, session.pictureUrl)
      : SecureStore.deleteItemAsync(KEYS.pictureUrl),
  );
  await Promise.all(ops);
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.idToken),
    SecureStore.deleteItemAsync(KEYS.provider),
    SecureStore.deleteItemAsync(KEYS.sub),
    SecureStore.deleteItemAsync(KEYS.name),
    SecureStore.deleteItemAsync(KEYS.email),
    SecureStore.deleteItemAsync(KEYS.pictureUrl),
  ]);
}
