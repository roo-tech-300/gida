import { StyleSheet, Text, TextInput, View } from 'react-native';

import { DesignColors, fontFamily } from '@/constants/design';

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export function AddPlaceField({ label, hint, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  invalid?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

export function AddPlaceInput({
  value,
  onChangeText,
  placeholder,
  maxLength,
  multiline = false,
  invalid = false,
  autoCapitalize = 'sentences',
}: InputProps) {
  return (
    <TextInput
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={DesignColors.textSecondary}
      style={[styles.input, multiline && styles.multiline, invalid && styles.inputInvalid]}
      textAlignVertical={multiline ? 'top' : 'center'}
      value={value}
    />
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: DesignColors.textPrimary,
    fontFamily,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  error: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.error,
    fontFamily,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
    color: DesignColors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily,
  },
  multiline: {
    minHeight: 112,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputInvalid: {
    borderColor: DesignColors.danger,
  },
});
