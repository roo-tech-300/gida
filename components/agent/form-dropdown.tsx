import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

type FormDropdownProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  label?: string;
};

export function FormDropdown({ icon, value, options, onSelect, label }: FormDropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={styles.row} onPress={() => setVisible(true)}>
        <Ionicons name={icon} size={20} color={DesignColors.onSurfaceVariant} />
        <Text style={[styles.text, !value && styles.placeholder]}>
          {value || 'Select...'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={DesignColors.outline} />
      </Pressable>

      <Modal transparent visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={styles.sheet}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={[styles.option, opt === value && styles.optionActive]}
                onPress={() => { onSelect(opt); setVisible(false); }}
              >
                <Text style={[styles.optionText, opt === value && styles.optionTextActive]}>{opt}</Text>
                {opt === value && <Ionicons name="checkmark" size={20} color={DesignColors.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
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
  text: { flex: 1, ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  placeholder: { color: DesignColors.outline },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  sheet: { backgroundColor: DesignColors.surfaceContainerLow, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: DesignSpacing.md, gap: DesignSpacing.xs },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: DesignSpacing.md, borderRadius: DesignRadius.lg },
  optionActive: { backgroundColor: 'rgba(124, 58, 237, 0.08)' },
  optionText: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily },
  optionTextActive: { color: DesignColors.primary, fontWeight: '600' },
});
