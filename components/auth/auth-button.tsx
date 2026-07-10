import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import {
  DesignColors,
  DesignLayout,
  DesignRadius,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type AuthButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean; // 👈 Added optional loading state
};

export function AuthButton({ 
  label, 
  variant = 'primary', 
  disabled, 
  isLoading, // 👈 Destructured loading flag
  style, 
  ...props 
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  const isInteractionDisabled = disabled || isLoading; // Disable interaction if loading

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isInteractionDisabled}
      style={({ pressed, hovered }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (pressed || hovered) && !isLoading && styles.pressed, // Prevent scaling while loading
        isInteractionDisabled && styles.disabled,
        typeof style === 'function' ? style({ pressed, hovered }) : style,
      ]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={isPrimary ? DesignColors.onPrimary : DesignColors.textPrimary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: DesignLayout.buttonHeight,
    borderRadius: DesignRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: DesignColors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pressed: {
    transform: [{ scale: 1.02 }],
    opacity: 0.92,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...DesignTypography.bodyLg,
    fontWeight: '600',
    fontFamily,
  },
  primaryLabel: {
    color: DesignColors.onPrimary,
  },
  secondaryLabel: {
    color: DesignColors.textPrimary,
  },
});