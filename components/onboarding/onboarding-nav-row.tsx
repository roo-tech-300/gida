import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/onboarding-continue-button';
import {
  DesignColors,
  DesignLayout,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

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
  return (
    <View style={styles.row}>
      {showBack && onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Ionicons name="arrow-back" size={18} color={DesignColors.onSurface} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
      <View style={showBack && onBack ? styles.continueWrap : styles.continueFull}>
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
    gap: DesignSpacing.md,
    marginTop: DesignSpacing.lg,
  },
  backButton: {
    flex: 1,
    height: DesignLayout.buttonHeight,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backLabel: {
    ...DesignTypography.headlineMd,
    color: DesignColors.onSurface,
    fontFamily,
  },
  continueWrap: {
    flex: 2,
  },
  continueFull: {
    flex: 1,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
