import { forwardRef, useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { DiscoverListingCard } from '@/components/home/discover-listing-card';
import { PodShelfCard } from '@/components/home/pod-shelf-card';
import { LoadingFooter } from '@/components/ui/loading-footer';
import { DesignColors } from '@/constants/design';
import type { RecommendedPod } from '@/types/pod-recommendation';
import type { FeedItem } from '@/utils/feed-interleave';

type Props = {
  items: readonly FeedItem[];
  likedIds: ReadonlySet<string>;
  onToggleLike: (id: string) => void;
  onViewListing: (id: string) => void;
  onOpenPod: (pod: RecommendedPod) => void;
  itemHeight: number;
  refreshing: boolean;
  onRefresh: () => void;
  onIndexChange?: (index: number) => void;
  onScrollOffsetChange?: (offset: number) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  isLoadingMore?: boolean;
};

export const DiscoverListingFeed = forwardRef<FlatList<FeedItem>, Props>(function DiscoverListingFeed(
  {
    items,
    likedIds,
    onToggleLike,
    onViewListing,
    onOpenPod,
    itemHeight,
    refreshing,
    onRefresh,
    onIndexChange,
    onScrollOffsetChange,
    onEndReached,
    onEndReachedThreshold,
    isLoadingMore = false,
  },
  ref,
) {
  const listRef = useRef<FlatList<FeedItem> | null>(null);

  const setRef = useCallback(
    (node: FlatList<FeedItem> | null) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const handleMomentumEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
      if (idx !== currentIndex) {
        setCurrentIndex(idx);
        onIndexChange?.(idx);
      }
    },
    [itemHeight, currentIndex, onIndexChange],
  );

  return (
    <FlatList
      ref={setRef}
      data={items}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) =>
        item.kind === 'pods' ? (
          <PodShelfCard pods={item.pods} height={itemHeight} onOpenPod={onOpenPod} />
        ) : (
          <DiscoverListingCard
            listing={item.listing}
            liked={likedIds.has(item.listing.id)}
            onToggleLike={onToggleLike}
            onViewListing={onViewListing}
            height={itemHeight}
          />
        )
      }
      getItemLayout={(_, index) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      })}
      snapToInterval={itemHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      bounces={currentIndex === 0}
      onMomentumScrollEnd={handleMomentumEnd}
      onScroll={(e) => onScrollOffsetChange?.(e.nativeEvent.contentOffset.y)}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold ?? 0.5}
      ListFooterComponent={<LoadingFooter isLoading={isLoadingMore} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={DesignColors.primaryFixed}
          colors={[DesignColors.primaryFixed, DesignColors.primary]}
          progressBackgroundColor={DesignColors.surfaceContainerLow}
        />
      }
      style={styles.list}
    />
  );
});

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
