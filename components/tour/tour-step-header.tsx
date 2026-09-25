import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { AppTourStep } from '@/types/app-tour';

type Props = {
  step: AppTourStep;
  totalSteps: number;
};

export function TourStepHeader({ step, totalSteps }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{step.badge}</Text>
        </View>
        <Text style={styles.stepCounter}>
          {step.stepNumber} of {totalSteps}
        </Text>
      </View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.subtitle}>{step.subtitle}</Text>

      <View style={styles.bulletsWrap}>
        {step.bullets.map((bullet, idx) => (
          <View key={`bullet-${idx}`} style={styles.bulletRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={bullet.icon} size={15} color={DesignColors.primaryBright} />
            </View>
            <Text style={styles.bulletText}>{bullet.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: DesignSpacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DesignSpacing.xs,
  },
  badge: {
    backgroundColor: DesignColors.primaryTint,
    borderRadius: DesignRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: DesignColors.primaryTintBorder,
  },
  badgeText: {
    ...DesignTypography.labelSm,
    color: DesignColors.primaryBright,
    fontFamily,
    fontWeight: '700',
  },
  stepCounter: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  title: {
    ...DesignTypography.headlineLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '800',
  },
  subtitle: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    lineHeight: 20,
    marginTop: 2,
  },
  bulletsWrap: {
    marginTop: DesignSpacing.sm,
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DesignColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletText: {
    flex: 1,
    ...DesignTypography.bodyMd,
    color: DesignColors.textPrimary,
    fontFamily,
  },
});
