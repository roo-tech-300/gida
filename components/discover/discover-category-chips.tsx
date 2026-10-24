import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { CategoryChip } from '@/components/ui/category-chip';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { PLACE_CATEGORIES } from '@/constants/place-categories';
import { useInfiniteCategories } from '@/hooks/use-categories';
import type { DiscoverCategoryFilter } from '@/hooks/use-discover-feed';

type Props = {
  active: DiscoverCategoryFilter;
  savedOnly: boolean;
  onChange: (category: DiscoverCategoryFilter) => void;
  onToggleSaved: () => void;
};

type ChipItem =
  | { type: 'all' }
  | { type: 'saved' }
  | { type: 'category'; key: string; label: string; icon_key: string };

function getFallbackIcon(iconKey: string): keyof typeof Ionicons.glyphMap {
  return (iconKey as keyof typeof Ionicons.glyphMap) ?? 'grid-outline';
}

export function DiscoverCategoryChips({ active, savedOnly, onChange, onToggleSaved }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteCategories(20);

  // Flatten remote pages; fall back to local constants until the first fetch lands
  const remoteCategories =
    status === 'success' ? (data?.pages.flatMap((p) => p) ?? []) : [];

  const sourceCategories =
    remoteCategories.length > 0
      ? remoteCategories
      : PLACE_CATEGORIES.map((c) => ({
          key: c.key,
          label: c.label,
          icon_key: c.icon,
          accent_color: c.accent,
        }));

  const items: ChipItem[] = [
    { type: 'all' },
    ...sourceCategories.map((c) => ({
      type: 'category' as const,
      key: c.key,
      label: c.label,
      icon_key: c.icon_key,
    })),
    { type: 'saved' },
  ];

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  };

  return (
    <FlatList
      horizontal
      data={items}
      keyExtractor={(item) =>
        item.type === 'category' ? item.key : item.type
      }
      contentContainerStyle={styles.content}
      showsHorizontalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={DesignColors.primary} />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        if (item.type === 'all') {
          return (
            <CategoryChip
              active={!savedOnly && active === 'all'}
              icon="grid-outline"
              label="All"
              onPress={() => onChange('all')}
            />
          );
        }
        if (item.type === 'saved') {
          return (
            <CategoryChip
              active={savedOnly}
              label="Saved"
              onPress={onToggleSaved}
            />
          );
        }
        return (
          <CategoryChip
            active={!savedOnly && active === item.key}
            icon={getFallbackIcon(item.icon_key)}
            label={item.label}
            onPress={() => onChange(item.key as DiscoverCategoryFilter)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: 8,
    paddingVertical: 2,
  },
  loadingMore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});
