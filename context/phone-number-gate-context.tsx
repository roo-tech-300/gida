import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

import { PhoneNumberGateModal } from '@/components/ui/phone-number-gate-modal';
import { getMyPhoneNumber } from '@/services/phone-number-service';

type PhoneNumberGateValue = {
  requirePhoneNumber: () => Promise<boolean>;
  isCheckingPhoneNumber: boolean;
};
const PhoneNumberGateContext = createContext<PhoneNumberGateValue | null>(null);
const PHONE_LOOKUP_TIMEOUT_MS = 12000;

async function lookupPhoneNumber(): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Phone number check timed out. Check your connection and retry.')), PHONE_LOOKUP_TIMEOUT_MS);
  });
  try {
    return await Promise.race([getMyPhoneNumber(), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function PhoneNumberGateProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const resolver = useRef<((saved: boolean) => void) | null>(null);
  const pending = useRef<Promise<boolean> | null>(null);

  const finish = useCallback((saved: boolean) => {
    resolver.current?.(saved);
    resolver.current = null;
    pending.current = null;
    setVisible(false);
    setChecking(false);
    setLookupError(null);
  }, []);

  const verifyPhoneNumber = useCallback(async () => {
    setChecking(true);
    setLookupError(null);
    try {
      const savedNumber = await lookupPhoneNumber();
      if (savedNumber) {
        finish(true);
      } else {
        setVisible(true);
      }
    } catch (error) {
      console.error('[PhoneNumberGate] Could not check the saved phone number:', error);
      setLookupError(error instanceof Error ? error.message : 'Could not check your saved number. Try again.');
      setVisible(true);
    } finally {
      setChecking(false);
    }
  }, [finish]);

  const requirePhoneNumber = useCallback(() => {
    if (pending.current) return pending.current;
    pending.current = new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      void verifyPhoneNumber();
    });
    return pending.current;
  }, [verifyPhoneNumber]);

  const retryCheck = useCallback(() => {
    void verifyPhoneNumber();
  }, [verifyPhoneNumber]);

  return (
    <PhoneNumberGateContext.Provider value={{ requirePhoneNumber, isCheckingPhoneNumber: checking }}>
      {children}
      {visible ? (
        <PhoneNumberGateModal
          visible={visible}
          checking={checking}
          lookupError={lookupError}
          onRetry={retryCheck}
          onCancel={() => finish(false)}
          onSaved={() => finish(true)}
        />
      ) : null}
    </PhoneNumberGateContext.Provider>
  );
}

export function usePhoneNumberGate(): PhoneNumberGateValue {
  const value = useContext(PhoneNumberGateContext);
  if (!value) throw new Error('usePhoneNumberGate must be used within PhoneNumberGateProvider.');
  return value;
}
