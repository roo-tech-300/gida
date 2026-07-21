import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  expiresAt: string;
  onExpired?: () => void;
};

function getRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: false,
  };
}

export function ClaimCountdown({ expiresAt, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() => getRemaining(expiresAt));

  useEffect(() => {
    if (remaining.expired) return;
    const interval = setInterval(() => {
      const next = getRemaining(expiresAt);
      setRemaining(next);
      if (next.expired) onExpired?.();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired, remaining.expired]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (remaining.expired) {
    return (
      <View style={styles.container}>
        <Ionicons name="time-outline" size={18} color={DesignColors.error} />
        <Text style={styles.expiredText}>Lock expired</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={18} color={DesignColors.secondary} />
      <Text style={styles.label}>Expires in</Text>
      <View style={styles.digits}>
        <Digit value={pad(remaining.hours)} unit="hrs" />
        <Text style={styles.separator}>:</Text>
        <Digit value={pad(remaining.minutes)} unit="min" />
        <Text style={styles.separator}>:</Text>
        <Digit value={pad(remaining.seconds)} unit="sec" />
      </View>
    </View>
  );
}

function Digit({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.digitWrap}>
      <Text style={styles.digitValue}>{value}</Text>
      <Text style={styles.digitUnit}>{unit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.md,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    padding: DesignSpacing.md,
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    marginRight: 'auto',
  },
  digits: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  digitWrap: {
    alignItems: 'center',
    minWidth: 36,
  },
  digitValue: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  digitUnit: {
    fontSize: 9,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textTransform: 'uppercase',
  },
  separator: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurfaceVariant,
    fontWeight: '700',
    marginTop: -10,
  },
  expiredText: {
    ...DesignTypography.labelSm,
    color: DesignColors.error,
    fontFamily,
    fontWeight: '600',
  },
});
