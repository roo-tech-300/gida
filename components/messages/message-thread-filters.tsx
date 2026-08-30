import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';

export function MessageThreadFilters({
  filters,
  activeFilter,
  onFilterChange,
}: {
  filters: readonly string[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <View style={styles.row}>
      {filters.map((filter) => {
        const active = filter === activeFilter;
        return (
          <Pressable
            key={filter}
            onPress={() => onFilterChange(filter)}
            style={[styles.pill, active && styles.pillActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{filter}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: DesignSpacing.sm,
    paddingRight: DesignSpacing.md,
  },
  pill: {
    minHeight: 40,
    paddingHorizontal: DesignSpacing.md,
    borderRadius: DesignRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: {
    backgroundColor: DesignColors.primaryContainer,
    borderColor: DesignColors.primaryContainer,
  },
  label: {
    ...DesignTypography.labelSm,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    fontWeight: '700',
  },
  labelActive: {
    color: DesignColors.onPrimaryContainer,
  },
});