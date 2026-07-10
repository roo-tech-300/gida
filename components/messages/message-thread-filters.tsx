import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { messageFilters } from '@/dummy/messages-mock';

type MessageFilter = (typeof messageFilters)[number];

export function MessageThreadFilters({
  filters,
  activeFilter,
  onFilterChange,
}: {
  filters: readonly MessageFilter[];
  activeFilter: MessageFilter;
  onFilterChange: (value: MessageFilter) => void;
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
    backgroundColor: '#1A1A1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
