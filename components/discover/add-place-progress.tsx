import { StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { AddPlaceStep } from '@/hooks/use-add-place-form';

const STEP_TITLES: Record<AddPlaceStep, string> = {
  1: 'Choose Category',
  2: 'Basic Details',
  3: 'GPS Location',
  4: 'Add Photos',
  5: 'Review & Submit',
};

type Props = {
  currentStep: AddPlaceStep;
};

export function AddPlaceProgress({ currentStep }: Props) {
  const steps: AddPlaceStep[] = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.stepTitle}>{STEP_TITLES[currentStep]}</Text>
        <Text style={styles.stepCounter}>Step {currentStep} of 5</Text>
      </View>

      <View style={styles.barRow}>
        {steps.map((s) => {
          const isCompleted = s < currentStep;
          const isCurrent = s === currentStep;
          return (
            <View
              key={s}
              style={[
                styles.segment,
                (isCompleted || isCurrent) && styles.segmentActive,
                isCompleted && styles.segmentCompleted,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.xs,
    paddingBottom: DesignSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DesignColors.textPrimary,
    fontFamily,
    letterSpacing: -0.3,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: DesignColors.primaryFixed,
    fontFamily,
  },
  barRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: DesignColors.surfaceContainerHigh,
  },
  segmentActive: {
    backgroundColor: DesignColors.primary,
  },
  segmentCompleted: {
    backgroundColor: DesignColors.secondary,
  },
});
