import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/ui/category-chip';
import { DesignColors } from '@/constants/design';
import { PLACE_CATEGORIES } from '@/constants/place-categories';
import { useInfiniteCategories } from '@/hooks/use-categories';
import type { PlaceCategory } from '@/types/place';

type Props = {
  value: PlaceCategory | null;
  onChange: (category: PlaceCategory) => void;
};

/** Fallback to the local constant so the UI is never empty while the fetch loads. */
function getFallbackIcon(iconKey: string): keyof typeof Ionicons.glyphMap {
  return (iconKey as keyof typeof Ionicons.glyphMap) ?? 'grid-outline';
}

export function AddPlaceCategoryPicker({ value, onChange }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteCategories(20);

  // Flatten pages into a single list; fall back to local constants while loading
  const categories =
    status === 'success' && (data?.pages.flatMap((p) => p) ?? []).length > 0
      ? data.pages.flatMap((p) => p)
      : PLACE_CATEGORIES.map((c) => ({
          key: c.key,
          label: c.label,
          icon_key: c.icon,
          accent_color: c.accent,
        }));

  const handleScrollEnd = ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const paddingToBottom = 40;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - paddingToBottom;
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.grid}
      onScroll={handleScrollEnd}
      scrollEventThrottle={200}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {categories.map((category) => (
        <CategoryChip
          key={category.key}
          active={value === category.key}
          icon={getFallbackIcon(category.icon_key)}
          label={category.label}
          onPress={() => onChange(category.key as PlaceCategory)}
        />
      ))}

      {isFetchingNextPage && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={DesignColors.primary} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 220,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  loadingMore: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
