import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  isLastStep: boolean;
  canGoBack: boolean;
  isSubmitting?: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;
};

export function TourControls({
  isLastStep,
  canGoBack,
  isSubmitting = false,
  onNext,
  onBack,
  onSkip,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.mainRow}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            disabled={isSubmitting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={18} color={DesignColors.onSurface} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : onSkip ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSkip}
            disabled={isSubmitting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}>
            <Text style={styles.skipText}>Skip Tour</Text>
          </Pressable>
        ) : (
          <View style={styles.emptySlot} />
        )}

        <Pressable
          accessibilityRole="button"
          onPress={onNext}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.nextBtn,
            pressed && styles.pressed,
            isSubmitting && styles.btnDisabled,
          ]}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color={DesignColors.onPrimary} />
          ) : (
            <>
              <Text style={styles.nextText}>{isLastStep ? 'Get Started' : 'Next'}</Text>
              <Ionicons
                name={isLastStep ? 'checkmark' : 'arrow-forward'}
                size={18}
                color={DesignColors.onPrimary}
              />
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: DesignSpacing.sm,
    gap: DesignSpacing.xs,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignSpacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  backText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  skipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '500',
  },
  emptySlot: {
    width: 60,
  },
  nextBtn: {
    flex: 1,
    height: 48,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: DesignSpacing.lg,
  },
  nextText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.8,
  },
});
