import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from 'react-native';

import { DesignColors, DesignRadius, DesignTypography, fontFamily } from '@/constants/design';

type OnboardingContinueButtonProps = PressableProps & {
  label?: string;
  isLoading?: boolean;
  showArrow?: boolean;
  /** Text color override for the label. */
  labelColor?: string;
};

export function OnboardingContinueButton({
  label = 'Continue',
  isLoading,
  showArrow = true,
  labelColor = DesignColors.onPrimary,
  disabled,
  style,
  onPress,
  ...props
}: OnboardingContinueButtonProps) {
  const isDisabled = Boolean(disabled || isLoading);

  const handlePress = (event: GestureResponderEvent) => {
    if (isDisabled) return;
    onPress?.(event);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => [
        styles.base,
        (pressed || isLoading) && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style({ pressed: pressed && !isDisabled, hovered: false }) : style,
      ]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={DesignColors.onPrimaryContainer} />
      ) : (
        <>
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          {showArrow ? <Ionicons name="arrow-forward" size={20} color={labelColor} /> : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    alignSelf: 'stretch',
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
