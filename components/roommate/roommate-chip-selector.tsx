import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';

type ChipOption = { id: string; label: string };

type Props = {
  label: string;
  options: ChipOption[];
  value: string | null;
  onSelect: (id: string) => void;
};

export function RoommateChipSelector({ label, options, value, onSelect }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const selected = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: DesignSpacing.sm },
  label: {
    ...DesignTypography.labelCaps,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm + 2,
    borderRadius: DesignRadius.full,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  chipSelected: {
    backgroundColor: DesignColors.secondary,
    borderColor: DesignColors.secondary,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  chipText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '500',
  },
  chipTextSelected: { color: DesignColors.onPrimary, fontWeight: '600' },
});
