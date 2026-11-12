import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { LoadingFooter } from '@/components/ui/loading-footer';
import { ListState } from '@/components/ui/list-state';
import { useSpotsLeft } from '@/hooks/use-spots-left';
import { DesignColors, DesignSpacing, DesignTypography, fontFamily } from '@/constants/design';
import type { FeedListing } from '@/types/feed-listing';

import { PlaceCard } from './place-card';

type Props = {
  listings: FeedListing[];
  likedIds: ReadonlySet<string>;
  isLoading: boolean;
  isRefetching: boolean;
  isFetchingMore: boolean;
  hasActiveFilters: boolean;
  onToggleLike: (id: string) => void;
  onOpen: (id: string) => void;
  onRefresh: () => void;
  onEndReached: () => void;
  onClearFilters: () => void;
};

function countLabel(count: number, filtered: boolean): string {
  const noun = count === 1 ? '1 place' : `${count} places`;
  if (!filtered) return noun;
  return `${noun} ${count === 1 ? 'matches' : 'match'} your filters`;
}

/** A scannable list of places: about 1.6 cards per screen so students can compare. */
export function PlacesFeed({
  listings, likedIds, isLoading, isRefetching, isFetchingMore, hasActiveFilters,
  onToggleLike, onOpen, onRefresh, onEndReached, onClearFilters,
}: Props) {
  const spotsLeft = useSpotsLeft(listings.map((listing) => listing.id));
  const renderItem = useCallback(
    ({ item }: { item: FeedListing }) => (
      <PlaceCard listing={item} liked={likedIds.has(item.id)} spotsLeft={spotsLeft[item.id]} onToggleLike={onToggleLike} onPress={onOpen} />
    ),
    [likedIds, spotsLeft, onToggleLike, onOpen],
  );

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={
        <View style={styles.header}>
          {!isLoading ? (
            <Text style={styles.count} testID="places-count">
              {countLabel(listings.length, hasActiveFilters)}
            </Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        isLoading ? <ListState kind="loading" message="Finding places…" /> : (
          <View style={styles.empty} testID="places-empty">
            <ListState kind="empty" message={hasActiveFilters ? 'Nothing matches these filters yet.' : 'No places listed yet. Check back soon.'} />
            {hasActiveFilters ? <AuthButton label="Clear filters" variant="secondary" onPress={onClearFilters} /> : null}
          </View>
        )
      }
      ListFooterComponent={<LoadingFooter isLoading={isFetchingMore} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={DesignColors.primaryBright} colors={[DesignColors.primaryBright]} />}
      contentContainerStyle={styles.content}
      initialNumToRender={4}
      windowSize={7}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: DesignSpacing.lg },
  header: { gap: DesignSpacing.md, paddingBottom: DesignSpacing.md },
  count: { ...DesignTypography.labelLg, color: DesignColors.onSurfaceVariant, fontFamily, marginHorizontal: DesignSpacing.marginMobile },
  empty: { marginHorizontal: DesignSpacing.marginMobile, gap: DesignSpacing.md },
});
