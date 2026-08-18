import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, fontFamily } from '@/constants/design';

type Props = {
  labels: string[];
  value: number;
  onChange: (value: number) => void;
};

export function ChoiceChipRow({ labels, value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {labels.map((label, index) => {
        const selected = value === index;
        return (
          <Pressable
            key={label}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(index)}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  chip: {
    paddingHorizontal: DesignSpacing.md,
    paddingVertical: DesignSpacing.sm + 2,
    borderRadius: DesignRadius.full,
    borderWidth: 1,
    borderColor: DesignColors.inputBorder,
    backgroundColor: DesignColors.surfaceContainerLow,
  },
  chipSelected: {
    borderColor: DesignColors.primaryBright,
    backgroundColor: DesignColors.primaryTint,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: DesignColors.onSurfaceVariant,
    fontFamily,
  },
  chipTextSelected: {
    color: DesignColors.onPrimaryContainer,
  },
});
