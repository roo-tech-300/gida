import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  DesignColors,
  DesignRadius,
  DesignSpacing,
  DesignTypography,
  fontFamily,
} from '@/constants/design';
import type { Amenity } from '@/types/onboarding';

type AmenityGridProps = {
  options: { id: Amenity; label: string; icon: string }[];
  selected: Amenity[];
  onToggle: (id: Amenity) => void;
};

export function AmenityGrid({ options, selected, onToggle }: AmenityGridProps) {
  return (
    <View style={styles.grid}>
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => onToggle(opt.id)}
            style={({ pressed }) => [
              styles.cell,
              isSelected && styles.cellSelected,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.iconWrap, isSelected && styles.iconWrapSelected]}>
              <Ionicons
                name={opt.icon as keyof typeof Ionicons.glyphMap}
                size={22}
                color={isSelected ? DesignColors.onSurface : DesignColors.onSurfaceVariant}
              />
            </View>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignSpacing.sm,
  },
  cell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSpacing.sm,
    padding: DesignSpacing.md,
    borderRadius: DesignRadius.md,
    backgroundColor: DesignColors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  cellSelected: {
    backgroundColor: DesignColors.successContainer,
    borderColor: DesignColors.secondary,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: DesignRadius.sm,
    backgroundColor: DesignColors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapSelected: {
    backgroundColor: DesignColors.secondary,
  },
  label: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    flex: 1,
  },
  labelSelected: {
    color: DesignColors.onSurface,
    fontWeight: '600',
  },
});
