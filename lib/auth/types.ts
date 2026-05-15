export type Provider = 'stub' | 'google' | 'apple';

export type AuthSession = {
  idToken: string;
  provider: Provider;
  sub: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
};
