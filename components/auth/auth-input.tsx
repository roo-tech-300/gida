import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string;
  isPassword?: boolean;
};

export function AuthInput({ label, error, isPassword, style, ...props }: AuthInputProps) {
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderColor = error
    ? DesignColors.error
    : focused
      ? DesignColors.primary
      : DesignColors.inputBorder;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, { borderColor }, error && styles.fieldError]}>
        <TextInput
          {...props}
          secureTextEntry={isPassword && !visible}
          placeholderTextColor={DesignColors.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setVisible((v) => !v)}
            style={styles.eyeButton}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={DesignColors.outline}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: DesignSpacing.sm,
  },
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: DesignSpacing.md,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.lg,
    borderWidth: 1,
  },
  fieldError: {
    backgroundColor: 'rgba(147, 0, 10, 0.15)',
  },
  input: {
    flex: 1,
    ...DesignTypography.bodyLg,
    color: DesignColors.textPrimary,
    fontFamily,
    paddingVertical: Platform.select({ web: 14, default: 12 }),
  },
  eyeButton: {
    marginLeft: DesignSpacing.sm,
    padding: DesignSpacing.xs,
  },
  error: {
    ...DesignTypography.labelSm,
    color: DesignColors.error,
    fontFamily,
  },
});
