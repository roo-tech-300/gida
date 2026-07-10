import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import {
  DesignColors,
  DesignLayout,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type AuthOptionVariant = 'apple' | 'phone' | 'email';

type AuthOptionButtonProps = PressableProps & {
  label: string;
  variant: AuthOptionVariant;
};

export function AuthOptionButton({ label, variant, disabled, style, ...props }: AuthOptionButtonProps) {
  const isApple = variant === 'apple';
  const isPhone = variant === 'phone';
  const isEmail = variant === 'email';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.base,
        isApple && styles.apple,
        isPhone && styles.phone,
        isEmail && styles.email,
        (pressed || hovered) && !isEmail && styles.pressed,
        (pressed || hovered) && isEmail && styles.emailPressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style({ pressed, hovered }) : style,
      ]}
      {...props}>
      {isApple ? (
        <Ionicons name="logo-apple" size={20} color="#000000" />
      ) : null}
      {isPhone ? (
        <Ionicons name="phone-portrait-outline" size={22} color={DesignColors.onSurface} />
      ) : null}
      <Text
        style={[
          styles.label,
          isApple && styles.appleLabel,
          isPhone && styles.phoneLabel,
          isEmail && styles.emailLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: DesignLayout.buttonHeight,
    borderRadius: DesignRadius.lg,
    paddingHorizontal: DesignSpacing.lg,
    width: '100%',
  },
  apple: {
    backgroundColor: '#ffffff',
  },
  phone: {
    backgroundColor: 'rgba(26, 26, 30, 0.8)',
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  email: {
    backgroundColor: 'transparent',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.94,
  },
  emailPressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...DesignTypography.bodyLg,
    fontFamily,
  },
  appleLabel: {
    color: '#000000',
    fontWeight: '700',
  },
  phoneLabel: {
    color: DesignColors.onSurface,
    fontWeight: '600',
  },
  emailLabel: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontWeight: '600',
  },
});
