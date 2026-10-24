import { StyleSheet, View } from 'react-native';
import { CategoryChip } from '@/components/ui/category-chip';
import { PLACE_CATEGORIES } from '@/constants/place-categories';
import type { PlaceCategory } from '@/types/place';

type Props = {
  value: PlaceCategory | null;
  onChange: (category: PlaceCategory) => void;
};

export function AddPlaceCategoryPicker({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {PLACE_CATEGORIES.map((category) => (
        <CategoryChip
          key={category.key}
          active={value === category.key}
          icon={category.icon}
          label={category.label}
          onPress={() => onChange(category.key)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});