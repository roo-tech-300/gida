import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/onboarding-continue-button';
import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type OnboardingNavRowProps = {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isLoading?: boolean;
  showBack?: boolean;
};

export function OnboardingNavRow({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled,
  isLoading,
  showBack = true,
}: OnboardingNavRowProps) {
  const hasBack = Boolean(showBack && onBack);

  return (
    <View style={styles.row}>
      {hasBack && onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="arrow-back" size={18} color={DesignColors.onSurface} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
      <View style={hasBack ? styles.continueWrap : styles.continueFull}>
        <OnboardingContinueButton
          label={continueLabel}
          onPress={onContinue}
          disabled={continueDisabled}
          isLoading={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: DesignSpacing.md,
    marginTop: DesignSpacing.lg,
  },
  backButton: {
    flex: 1,
    height: 48,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backLabel: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onSurface,
    fontFamily,
    fontWeight: '600',
  },
  continueWrap: {
    flex: 2,
    height: 48,
    alignSelf: 'stretch',
  },
  continueFull: {
    flex: 1,
    width: '100%',
    height: 48,
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
