import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { DesignColors, DesignRadius, DesignTypography, fontFamily } from '@/constants/design';

type OnboardingContinueButtonProps = PressableProps & {
  label?: string;
  isLoading?: boolean;
  showArrow?: boolean;
};

export function OnboardingContinueButton({
  label = 'Continue',
  isLoading,
  showArrow = true,
  disabled,
  style,
  ...props
}: OnboardingContinueButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || isLoading}
      style={({ pressed }) => [
        styles.base,
        (pressed || isLoading) && styles.pressed,
        (disabled || isLoading) && styles.disabled,
        typeof style === 'function' ? style({ pressed, hovered: false }) : style,
      ]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={DesignColors.onPrimaryContainer} />
      ) : (
        <>
          <Text style={styles.label}>{label}</Text>
          {showArrow ? <Ionicons name="arrow-forward" size={20} color={DesignColors.onPrimaryContainer} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...DesignTypography.bodyLg,
    color: DesignColors.onPrimary,
    fontFamily,
    fontWeight: '600',
  },
});
