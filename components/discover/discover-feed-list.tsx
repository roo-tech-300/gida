import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DiscoverEmptyState } from '@/components/discover/discover-empty-state';
import { DiscoverPlaceCard } from '@/components/discover/discover-place-card';
import { DiscoverTrendingRail } from '@/components/discover/discover-trending-rail';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import type { DiscoverFeed } from '@/hooks/use-discover-feed';
import type { Place } from '@/types/place';

type Props = {
  feed: DiscoverFeed;
  sectionTitle: string;
  emptyState: { title: string; message: string };
  isSaved: (id: string) => boolean;
  onOpenPlace: (place: Place) => void;
  onToggleSave: (place: Place) => void;
};

export function DiscoverFeedList({
  feed,
  sectionTitle,
  emptyState,
  isSaved,
  onOpenPlace,
  onToggleSave,
}: Props) {
  const handleEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  return (
    <FlatList
      data={feed.places}
      keyExtractor={(place) => place.id}
      renderItem={({ item }) => (
        <View style={styles.itemWrap}>
          <DiscoverPlaceCard
            place={item}
            saved={isSaved(item.id)}
            onPress={() => onOpenPlace(item)}
            onToggleSave={() => onToggleSave(item)}
          />
        </View>
      )}
      ItemSeparatorComponent={Separator}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View>
          {feed.trending.length > 0 && (
            <DiscoverTrendingRail
              places={feed.trending}
              isSaved={isSaved}
              onPressPlace={onOpenPlace}
              onToggleSave={onToggleSave}
            />
          )}
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
        </View>
      }
      ListEmptyComponent={
        <DiscoverEmptyState
          title={emptyState.title}
          message={emptyState.message}
          actionLabel={feed.hasActiveFilters ? 'Clear filters' : undefined}
          onAction={feed.hasActiveFilters ? feed.clearFilters : undefined}
        />
      }
      ListFooterComponent={
        feed.isFetchingNextPage ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={DesignColors.primary} />
          </View>
        ) : null
      }
      contentContainerStyle={styles.listContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={feed.isRefreshing}
          onRefresh={feed.refresh}
          tintColor={DesignColors.primary}
          colors={[DesignColors.primary]}
          progressBackgroundColor={DesignColors.surfaceContainer}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  itemWrap: {
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: DesignColors.textPrimary,
    fontFamily,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  separator: {
    height: 12,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
