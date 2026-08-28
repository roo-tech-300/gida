import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { DatePill } from '@/utils/tour-availability';

export function TourDatePicker({
  pills,
  selectedIndex,
  onSelect,
}: {
  pills: DatePill[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
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
  pillActive: { backgroundColor: DesignColors.primaryTint, borderColor: DesignColors.primaryBright },
  day: { ...DesignTypography.labelSm, color: DesignColors.onSurfaceVariant, fontFamily },
  dayActive: { color: DesignColors.primaryBright },
  number: { ...DesignTypography.bodyLg, color: DesignColors.onSurface, fontFamily, fontWeight: '700' },
  numberActive: { color: DesignColors.onPrimaryContainer },
});
