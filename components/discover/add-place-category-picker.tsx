import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CategoryChip } from '@/components/ui/category-chip';
import { SearchBar } from '@/components/ui/search-bar';
import { DesignColors, DesignTypography, fontFamily } from '@/constants/design';
import { PLACE_CATEGORIES } from '@/constants/place-categories';
import { useCategorySearch, useInfiniteCategories } from '@/hooks/use-categories';
import type { PlaceCategory } from '@/types/place';

type Props = {
  value: PlaceCategory | null;
  onChange: (category: PlaceCategory) => void;
};

function toIonIcon(iconKey: string): keyof typeof Ionicons.glyphMap {
  return (iconKey as keyof typeof Ionicons.glyphMap) ?? 'grid-outline';
}

export function AddPlaceCategoryPicker({ value, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // Infinite list for the default (non-search) state
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status: infiniteStatus } =
    useInfiniteCategories(12);

  // Smart search — hits both place_categories and category_synonyms
  const {
    data: searchResults,
    isFetching: isSearching,
  } = useCategorySearch(searchQuery);

  const isSearchMode = searchQuery.trim().length >= 2;

  // Resolve which list to show
  const displayCategories = (() => {
    if (isSearchMode) {
      return searchResults ?? [];
    }
    if (infiniteStatus === 'success') {
      const flat = data?.pages.flatMap((p) => p) ?? [];
      if (flat.length > 0) return flat;
    }
    // Fallback to local constants while the first page loads
    return PLACE_CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      icon_key: c.icon,
      accent_color: c.accent,
    }));
  })();

  const handleScrollEnd = ({
    nativeEvent,
  }: {
    nativeEvent: {
      contentOffset: { y: number };
      contentSize: { height: number };
      layoutMeasurement: { height: number };
    };
  }) => {
    if (isSearchMode) return; // no pagination in search mode
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const nearBottom =
      contentOffset.y + layoutMeasurement.height >= contentSize.height - 40;
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search categories (e.g. restaurant, gym…)"
        onClear={() => setSearchQuery('')}
      />

      {/* Results area */}
      {isSearchMode && isSearching ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={DesignColors.primary} />
        </View>
      ) : isSearchMode && displayCategories.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="search-outline" size={28} color={DesignColors.onSurfaceVariant} />
          <Text style={styles.emptyText}>No categories matched "{searchQuery}"</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.grid}
          onScroll={handleScrollEnd}
          scrollEventThrottle={200}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {displayCategories.map((category) => (
            <CategoryChip
              key={category.key}
              active={value === category.key}
              icon={toIonIcon(category.icon_key)}
              label={category.label}
              onPress={() => onChange(category.key as PlaceCategory)}
            />
          ))}

          {/* Lazy-load spinner at the bottom of the paginated list */}
          {!isSearchMode && isFetchingNextPage && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={DesignColors.primary} />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  scroll: {
    maxHeight: 220,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  emptyText: {
    ...DesignTypography.bodyMd,
    color: DesignColors.onSurfaceVariant,
    fontFamily,
    textAlign: 'center',
  },
  loadingMore: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
