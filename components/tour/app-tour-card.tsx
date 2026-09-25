import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing } from '@/constants/design';
import type { AppTourStep } from '@/types/app-tour';
import { TourPaginationDots } from './tour-pagination-dots';
import { TourStepHeader } from './tour-step-header';
import { TourStepPreview } from './tour-step-preview';

type Props = {
  step: AppTourStep;
  totalSteps: number;
  activeIndex: number;
};

export function AppTourCard({ step, totalSteps, activeIndex }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.glow} pointerEvents="none" />
      <TourStepHeader step={step} totalSteps={totalSteps} />
      <TourStepPreview stepId={step.id} />
      <TourPaginationDots total={totalSteps} activeIndex={activeIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
    borderColor: DesignColors.borderSoft,
    padding: DesignSpacing.lg,
    gap: DesignSpacing.md,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: DesignColors.primaryTint,
  },
});
