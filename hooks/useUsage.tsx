import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  getJstDateClient,
  loadUsageState,
  saveUsageState,
  type UsageState,
} from '@/lib/usage';

const DEFAULT_MAX = 3;

type UsageContextValue = {
  usage: UsageState | null;
  remaining: number;
  isLoading: boolean;
  updateUsage: (next: { today: number; max: number }) => Promise<void>;
  reset: () => Promise<void>;
};

const UsageContext = createContext<UsageContextValue | null>(null);

export function UsageProvider({ children }: { children: ReactNode }) {
  const [usage, setUsage] = useState<UsageState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsageState()
      .then((state) => {
        if (state && state.dateJst === getJstDateClient()) {
          setUsage(state);
        } else {
          setUsage(null);
        }
      })
      .catch(() => setUsage(null))
      .finally(() => setIsLoading(false));
  }, []);

  const updateUsage = async (next: { today: number; max: number }) => {
    const state: UsageState = { ...next, dateJst: getJstDateClient() };
    setUsage(state);
    await saveUsageState(state);
  };

  const reset = async () => {
    const state: UsageState = { today: 0, max: DEFAULT_MAX, dateJst: getJstDateClient() };
    setUsage(state);
    await saveUsageState(state);
  };

  const remaining = usage ? Math.max(0, usage.max - usage.today) : DEFAULT_MAX;

  const value: UsageContextValue = { usage, remaining, isLoading, updateUsage, reset };

  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
}

export function useUsage(): UsageContextValue {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error('useUsage must be used inside <UsageProvider>');
  return ctx;
}
