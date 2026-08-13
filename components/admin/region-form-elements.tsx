import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';

export function RegionFormBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

export function RegionField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export function RegionInput(props: TextInputProps) {
  return <TextInput placeholderTextColor={DesignColors.onSurfaceVariant} style={styles.input} {...props} />;
}

export function RegionReadonlyValue({ value }: { value: string }) {
  return (
    <View style={styles.input}>
      <Text style={styles.readonlyText} numberOfLines={1}>{value}</Text>
    </View>
  );
}

type SubmitProps = {
  label: string;
  isPending: boolean;
  disabled: boolean;
  onPress: () => void;
};

export function RegionSubmitButton({ label, isPending, disabled, onPress }: SubmitProps) {
  return (
    <Pressable style={[styles.submitBtn, disabled && styles.submitBtnDisabled]} onPress={onPress} disabled={disabled || isPending}>
      {isPending ? (
        <ActivityIndicator size="small" color={DesignColors.onSurface} />
      ) : (
        <Text style={styles.submitText}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: DesignSpacing.md },
  field: { gap: 6 },
  label: {
    fontSize: 12, fontWeight: '700', color: DesignColors.onSurfaceVariant, fontFamily,
    opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily,
    paddingVertical: 13, paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: DesignColors.borderFaint,
    borderWidth: 1, borderColor: DesignColors.borderSoft,
  },
  readonlyText: { fontSize: 14, fontWeight: '600', color: DesignColors.onSurface, fontFamily },
  submitBtn: {
    height: 50,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.primaryContainer,
  },
  submitBtnDisabled: { backgroundColor: DesignColors.surfaceContainerHighest },
  submitText: { fontSize: 16, fontWeight: '700', color: DesignColors.onSurface, fontFamily },
});
