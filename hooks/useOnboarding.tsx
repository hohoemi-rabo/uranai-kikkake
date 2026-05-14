import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  clearOnboardingCompleted,
  getOnboardingCompleted,
  setOnboardingCompleted,
} from '@/lib/onboarding';

type OnboardingState = {
  /** null = AsyncStorage 読み込み中 */
  onboardingDone: boolean | null;
  /** オンボーディング完了を記録(AsyncStorage + リアクティブ状態の両方を更新) */
  completeOnboarding: () => Promise<void>;
  /** オンボーディングをリセット(「はじめての方へ」再表示用) */
  resetOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboardingCompleted()
      .then(setOnboardingDone)
      .catch(() => setOnboardingDone(false));
  }, []);

  const completeOnboarding = async () => {
    await setOnboardingCompleted();
    setOnboardingDone(true);
  };

  const resetOnboarding = async () => {
    await clearOnboardingCompleted();
    setOnboardingDone(false);
  };

  const value: OnboardingState = {
    onboardingDone,
    completeOnboarding,
    resetOnboarding,
  };

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside <OnboardingProvider>');
  return ctx;
}
