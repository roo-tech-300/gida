import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import { TIME_SLOTS } from '@/dummy/tour-scheduler-mock';

export function TourSlotGrid({
  selectedSlot,
  onSelect,
}: {
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {TIME_SLOTS.map((slot) => {
        const active = selectedSlot === slot;
        return (
          <Pressable
            key={slot}
            onPress={() => onSelect(slot)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{slot}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignSpacing.sm },
  pill: {
    paddingHorizontal: DesignSpacing.lg,
    paddingVertical: 12,
    borderRadius: DesignRadius.lg,
    backgroundColor: DesignColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: DesignColors.cardBorder,
  },
  pillActive: { backgroundColor: DesignColors.primaryContainer, borderColor: DesignColors.primary },
  text: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  textActive: { color: DesignColors.onPrimaryContainer },
});
