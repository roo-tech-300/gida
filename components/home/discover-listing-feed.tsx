import { forwardRef, useCallback, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { DiscoverListingCard } from '@/components/home/discover-listing-card';
import { type FeedListing } from '@/types/feed-listing';

type Props = {
  listings: readonly FeedListing[];
  likedIds: ReadonlySet<string>;
  onToggleLike: (id: string) => void;
  onViewListing: (id: string) => void;
  itemHeight: number;
  refreshing: boolean;
  onRefresh: () => void;
  onIndexChange?: (index: number) => void;
};

export const DiscoverListingFeed = forwardRef<FlatList<FeedListing>, Props>(function DiscoverListingFeed(
  { listings, likedIds, onToggleLike, onViewListing, itemHeight, refreshing, onRefresh, onIndexChange },
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

  const handleMomentumEnd = useCallback(
    (e: any) => {
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
      data={listings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <DiscoverListingCard
          listing={item}
          liked={likedIds.has(item.id)}
          onToggleLike={onToggleLike}
          onViewListing={onViewListing}
          height={itemHeight}
        />
      )}
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#D2BBFF"
          colors={['#D2BBFF', '#7C3AED']}
          progressBackgroundColor="#1A1A1E"
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
