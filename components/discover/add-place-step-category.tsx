import { StyleSheet, Text, View } from 'react-native';

import { AddPlaceCategoryPicker } from '@/components/discover/add-place-category-picker';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { PlaceCategory } from '@/types/place';

type Props = {
  selectedCategory: PlaceCategory;
  onSelectCategory: (category: PlaceCategory) => void;
};

export function AddPlaceStepCategory({ selectedCategory, onSelectCategory }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Select the primary vibe or service. This helps students find it quickly in Discover filters.
      </Text>

      <View style={styles.pickerWrap}>
        <AddPlaceCategoryPicker
          value={selectedCategory}
          onChange={onSelectCategory}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DesignSpacing.marginMobile,
    paddingTop: DesignSpacing.sm,
    gap: DesignSpacing.md,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  pickerWrap: {
    marginTop: DesignSpacing.xs,
  },
});
