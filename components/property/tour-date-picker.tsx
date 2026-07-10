import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useMemo } from 'react';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { getDatePills } from '@/dummy/tour-scheduler-mock';

export function TourDatePicker({
  selectedIndex,
  onSelect,
}: {
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const pills = useMemo(() => getDatePills(7), []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {pills.map((pill, i) => {
        const active = i === selectedIndex;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.day, active && styles.dayActive]}>{pill.dayName}</Text>
            <Text style={[styles.number, active && styles.numberActive]}>{pill.dayNumber}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: DesignSpacing.sm },
  pill: {
    width: 64,
    height: 80,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pillActive: { backgroundColor: DesignColors.primaryContainer, borderColor: DesignColors.primary },
  day: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  dayActive: { color: DesignColors.onPrimaryContainer },
  number: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  numberActive: { color: DesignColors.onPrimaryContainer },
});
