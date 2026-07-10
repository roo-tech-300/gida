import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { defaultOnboardingData, type OnboardingData } from '@/types/onboarding';

type OnboardingContextValue = {
  data: OnboardingData;
  updateData: (patch: Partial<OnboardingData>) => void;
  resetData: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);

  const value = useMemo(
    () => ({
      data,
      updateData: (patch: Partial<OnboardingData>) => setData((current) => ({ ...current, ...patch })),
      resetData: () => setData(defaultOnboardingData()),
    }),
    [data],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
