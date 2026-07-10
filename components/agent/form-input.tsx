import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type FormInputProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
};

export function FormInput({ icon, placeholder, value, onChangeText, label }: FormInputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={DesignColors.onSurfaceVariant} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={DesignColors.outline}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: DesignSpacing.xs },
  label: { ...DesignTypography.labelCaps, color: DesignColors.onSurfaceVariant, marginLeft: DesignSpacing.md },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: DesignSpacing.sm,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderRadius: DesignRadius.full, borderWidth: 1, borderColor: DesignColors.inputBorder,
    paddingHorizontal: DesignSpacing.md, height: 52,
  },
  input: { flex: 1, ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
});
