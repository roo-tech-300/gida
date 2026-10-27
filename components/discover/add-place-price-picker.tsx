import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DesignColors, fontFamily } from '@/constants/design';
import type { PriceRange } from '@/types/place';

const PRICE_RANGE_OPTIONS: { value: PriceRange; label: string; hint: string }[] = [
  { value: 1, label: '₦', hint: 'Budget' },
  { value: 2, label: '₦₦', hint: 'Mid-range' },
  { value: 3, label: '₦₦₦', hint: 'Premium' },
];

type Props = {
  value: PriceRange;
  onChange: (range: PriceRange) => void;
};

export function AddPlacePricePicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {PRICE_RANGE_OPTIONS.map((option) => {
        const active = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{option.label}</Text>
            <Text style={[styles.hint, active && styles.hintActive]}>{option.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 2,
    borderRadius: 14, borderWidth: 1, borderColor: DesignColors.cardBorder,
    backgroundColor: DesignColors.glassSoft,
  },
  optionActive: { backgroundColor: DesignColors.primary, borderColor: DesignColors.primary },
  label: { fontSize: 16, lineHeight: 20, fontWeight: '800', color: DesignColors.onSurfaceVariant, fontFamily },
  labelActive: { color: DesignColors.onPrimary },
  hint: { fontSize: 10, lineHeight: 13, color: DesignColors.textSecondary, fontFamily },
  hintActive: { color: DesignColors.onPrimary, opacity: 0.75 },
});
