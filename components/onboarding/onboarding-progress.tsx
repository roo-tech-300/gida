import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { ONBOARDING_STEPS } from '@/types/onboarding';

type OnboardingProgressProps = {
  step: number;
  label?: string;
};

export function OnboardingProgress({ step, label = 'Passport Setup' }: OnboardingProgressProps) {
  const progress = step / ONBOARDING_STEPS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.stepText}>
          Step {step} of {ONBOARDING_STEPS}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: DesignSpacing.sm,
    marginBottom: DesignSpacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.primaryBright,
    fontFamily,
    letterSpacing: 1.8,
  },
  stepText: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    opacity: 0.8,
  },
  track: {
    height: 6,
    borderRadius: 9999,
    backgroundColor: DesignColors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: DesignColors.primary,
    shadowColor: DesignColors.primary,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
});
