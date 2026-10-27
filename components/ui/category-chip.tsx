import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';

type Props = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function CategoryChip({ label, active, onPress, icon }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon && (
        <Ionicons
          color={active ? DesignColors.onPrimary : DesignColors.onSurfaceVariant}
          name={icon}
          size={14}
        />
      )}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.glassSoft,
  },
  chipActive: {
    backgroundColor: DesignColors.primary,
    borderColor: DesignColors.primary,
  },
  label: {
    ...DesignTypography.labelLg,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  labelActive: {
    color: DesignColors.onPrimary,
    fontWeight: '700',
  },
});
