import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { DiscoverEmptyState } from '@/components/discover/discover-empty-state';
import { DiscoverPlaceCard } from '@/components/discover/discover-place-card';
import { DiscoverTrendingRail } from '@/components/discover/discover-trending-rail';
import { SponsoredCard } from '@/components/discover/sponsored-card';
import { DesignColors, DesignSpacing, fontFamily } from '@/constants/design';
import { SPONSORED_PLACEMENTS } from '@/dummy/sponsored-mock';
import type { DiscoverFeed } from '@/hooks/use-discover-feed';
import type { Place } from '@/types/place';
import type { SponsoredPlacement } from '@/types/sponsored';
import { useRouter } from 'expo-router';

type DiscoverFeedItem =
  | { kind: 'place'; place: Place }
  | { kind: 'sponsor'; placement: SponsoredPlacement };

const RECOMMENDED_PLACE_IDS = new Set(
  SPONSORED_PLACEMENTS.map((placement) => placement.placeId),
);

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
  const router = useRouter();
  const sponsor = SPONSORED_PLACEMENTS[0] ?? null;
  const hasRecommendations = feed.isSearching && SPONSORED_PLACEMENTS.length > 0;

  const otherPlaces = useMemo(
    () =>
      hasRecommendations
        ? feed.places.filter((place) => !RECOMMENDED_PLACE_IDS.has(place.id))
        : feed.places,
    [feed.places, hasRecommendations],
  );

  const items = useMemo<DiscoverFeedItem[]>(() => {
    const next: DiscoverFeedItem[] = otherPlaces.map((place) => ({ kind: 'place', place }));
    if (!feed.isSearching && sponsor && !feed.hasActiveFilters && next.length > 0) {
      next.splice(Math.min(4, next.length), 0, { kind: 'sponsor', placement: sponsor });
    }
    return next;
  }, [feed.hasActiveFilters, feed.isSearching, otherPlaces, sponsor]);

  const openSponsored = useCallback(
    (placement: SponsoredPlacement) => {
      router.push(`/place/${placement.placeId}` as never);
    },
    [router],
  );

  const handleEndReached = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => (item.kind === 'place' ? item.place.id : item.placement.id)}
      renderItem={({ item }) => (
        <View style={styles.itemWrap}>
          {item.kind === 'place' ? (
            <DiscoverPlaceCard
              place={item.place}
              saved={isSaved(item.place.id)}
              onPress={() => onOpenPlace(item.place)}
              onToggleSave={() => onToggleSave(item.place)}
            />
          ) : (
            <SponsoredCard
              placement={item.placement}
              onPress={() => openSponsored(item.placement)}
            />
          )}
        </View>
      )}
      ItemSeparatorComponent={Separator}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={
        <View>
          {hasRecommendations ? (
            <View>
              <Text style={styles.sectionTitle}>Recommended places</Text>
              <View style={styles.recommendedWrap}>
                {SPONSORED_PLACEMENTS.map((placement) => (
                  <SponsoredCard
                    key={placement.id}
                    placement={placement}
                    onPress={() => openSponsored(placement)}
                  />
                ))}
              </View>
              <Text style={styles.sectionTitle}>Other results</Text>
              <Text style={styles.sectionCount}>{otherPlaces.length}</Text>
            </View>
          ) : (
            <View>
              {feed.trending.length > 0 && (
                <DiscoverTrendingRail
                  places={feed.trending}
                  isSaved={isSaved}
                  onPressPlace={onOpenPlace}
                  onToggleSave={onToggleSave}
                />
              )}
              <Text style={styles.sectionTitlePadded}>{sectionTitle}</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        hasRecommendations ? (
          <DiscoverEmptyState
            title="No other places found"
            message="Try a different search, or explore the recommended places above."
          />
        ) : (
          <DiscoverEmptyState
            title={emptyState.title}
            message={emptyState.message}
            actionLabel={feed.hasActiveFilters ? 'Clear filters' : undefined}
            onAction={feed.hasActiveFilters ? feed.clearFilters : undefined}
          />
        )
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
  recommendedWrap: {
    paddingHorizontal: DesignSpacing.marginMobile,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: DesignColors.textPrimary,
    fontFamily,
  },
  sectionTitlePadded: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: DesignColors.textPrimary,
    fontFamily,
    paddingHorizontal: DesignSpacing.marginMobile,
  },
  sectionCount: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.textSecondary,
    fontFamily,
  },
  sectionCountPadded: {
    fontSize: 12,
    lineHeight: 16,
    color: DesignColors.textSecondary,
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
