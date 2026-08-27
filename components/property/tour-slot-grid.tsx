import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DesignColors, DesignRadius, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { SlotOption } from '@/utils/tour-availability';

export function TourSlotGrid({
  slots,
  selectedSlot,
  onSelect,
}: {
  slots: SlotOption[];
  selectedSlot: string | null;
  onSelect: (slot: string) => void;
}) {
  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const active = selectedSlot === slot.time && slot.available;
        return (
          <Pressable
            key={slot.time}
            disabled={!slot.available}
            onPress={() => onSelect(slot.time)}
            style={[styles.pill, slot.available && styles.pillAvailable, active && styles.pillActive]}
          >
            <Text
              style={[
                styles.text,
                !slot.available && styles.textUnavailable,
                active && styles.textActive,
              ]}
            >
              {slot.time}
            </Text>
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
  pillAvailable: {},
  pillActive: { backgroundColor: DesignColors.primaryTint, borderColor: DesignColors.primaryBright },
  text: { ...DesignTypography.bodyMd, color: DesignColors.onSurface, fontFamily, fontWeight: '600' },
  textUnavailable: {
    color: DesignColors.outlineVariant,
    textDecorationLine: 'line-through',
  },
  textActive: { color: DesignColors.onPrimaryContainer },
});
