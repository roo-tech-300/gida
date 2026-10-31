import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { DiscoverListingCard } from '@/components/home/discover-listing-card';
import { LoadingFooter } from '@/components/ui/loading-footer';
import { type FeedListing } from '@/types/feed-listing';
import { DesignColors } from '@/constants/design';

/** Number of upcoming videos to preload (paused, mounted) beyond the active card. */
const PRELOAD_COUNT = 2;

type Props = {
  listings: readonly FeedListing[];
  likedIds: ReadonlySet<string>;
  onToggleLike: (id: string) => void;
  onViewListing: (id: string) => void;
  itemHeight: number;
  refreshing: boolean;
  onRefresh: () => void;
  onIndexChange?: (index: number) => void;
  onScrollOffsetChange?: (offset: number) => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  isLoadingMore?: boolean;
};

export const DiscoverListingFeed = forwardRef<FlatList<FeedListing>, Props>(function DiscoverListingFeed(
  {
    listings,
    likedIds,
    onToggleLike,
    onViewListing,
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
  const listRef = useRef<FlatList<FeedListing> | null>(null);

  const setRef = useCallback(
    (node: FlatList<FeedListing> | null) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollThrottleRef = useRef<number>(0);

  const setActiveIndex = useCallback(
    (index: number) => {
      if (index !== currentIndex && index >= 0 && index < listings.length) {
        setCurrentIndex(index);
        onIndexChange?.(index);
      }
    },
    [currentIndex, listings.length, onIndexChange],
  );

  /** Continuous scroll tracking: updates active index on every frame while scrolling. */
  const handleScroll = useCallback(
    (e: any) => {
      const now = Date.now();
      if (now - scrollThrottleRef.current < 16) return; // throttle ~60fps
      scrollThrottleRef.current = now;
      const offset = e.nativeEvent.contentOffset.y;
      const idx = Math.round(offset / itemHeight);
      setActiveIndex(idx);
      onScrollOffsetChange?.(offset);
    },
    [itemHeight, onScrollOffsetChange, setActiveIndex],
  );

  const handleMomentumEnd = useCallback(
    (e: any) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / itemHeight);
      setActiveIndex(idx);
    },
    [itemHeight, setActiveIndex],
  );

  // Indices whose video players should be mounted: active + next PRELOAD_COUNT.
  // Mounted-but-inactive players preload MP4 metadata via FFmpeg.wasm so the
  // next video is ready the moment the user swipes to it.
  const preloadIndices = useMemo(() => {
    const indices = new Set<number>();
    for (let i = currentIndex; i <= currentIndex + PRELOAD_COUNT; i++) {
      if (i < listings.length) indices.add(i);
    }
    return indices;
  }, [currentIndex, listings.length]);

  return (
    <FlatList
      ref={setRef}
      data={listings}
      keyExtractor={(item) => item.id}
      extraData={[currentIndex, preloadIndices]}
      renderItem={({ item, index }) => {
        const isActive = index === currentIndex;
        const shouldPreload = preloadIndices.has(index);
        return (
          <DiscoverListingCard
            listing={item}
            isActive={isActive}
            shouldPreload={shouldPreload}
            liked={likedIds.has(item.id)}
            onToggleLike={onToggleLike}
            onViewListing={onViewListing}
            height={itemHeight}
          />
        );
      }}
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
      onScroll={handleScroll}
      onMomentumScrollEnd={handleMomentumEnd}
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
