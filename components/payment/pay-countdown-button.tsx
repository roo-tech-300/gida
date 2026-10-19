import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { formatNaira } from '@/utils/format-naira';

type Props = {
  amount: number;
  onCountdownComplete: () => void;
  disabled?: boolean;
  testID?: string;
};

const COUNTDOWN_SECONDS = 5;

export function PayCountdownButton({ amount, onCountdownComplete, disabled = false, testID }: Props) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    if (disabled) return;
    setCountdown(COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onCountdownComplete();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [disabled, onCountdownComplete]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isCounting = countdown !== null;

  return (
    <Pressable
      style={[styles.button, (isCounting || disabled) && styles.buttonDisabled]}
      onPress={startCountdown}
      disabled={isCounting || disabled}
      testID={testID}
    >
      {isCounting ? (
        <Text style={styles.buttonText}>Redirecting in {countdown}s…</Text>
      ) : (
        <>
          <Ionicons name="lock-closed" size={16} color={DesignColors.onPrimaryContainer} />
          <Text style={styles.buttonText}>Pay {formatNaira(amount)}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DesignColors.primaryContainer,
    borderRadius: DesignRadius.full,
    paddingVertical: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimaryContainer,
    fontFamily,
    fontWeight: '700',
  },
});
