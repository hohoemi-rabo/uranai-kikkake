import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { registerOn401 } from '@/lib/api';
import { clearSession, loadSession, saveSession } from '@/lib/auth/secureStore';
import { signIn as signInDispatch } from '@/lib/auth/signIn';
import type { AuthSession, Provider } from '@/lib/auth/types';

type AuthState = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (provider?: Provider) => Promise<void>;
  signInWithSession: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (provider?: Provider) => {
    const next = await signInDispatch(provider);
    await saveSession(next);
    setSession(next);
  };

  const signInWithSession = async (next: AuthSession) => {
    await saveSession(next);
    setSession(next);
  };

  const signOut = async () => {
    await clearSession();
    setSession(null);
  };

  useEffect(() => {
    registerOn401(signOut);
  }, []);

  const value: AuthState = {
    session,
    isAuthenticated: session !== null,
    isLoading,
    signIn,
    signInWithSession,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
