import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DiscoverFeedHeader } from '@/components/home/discover-feed-header';
import { DiscoverListingFeed } from '@/components/home/discover-listing-feed';
import { FeedModeSelector } from '@/components/home/feed-mode-selector';
import { NoResultsFoundScreen } from '@/components/ui/no-results-found-screen';
import { RoommateDeck } from '@/components/home/roommate-deck';
import { discoverFilters, discoverListings, type PropertyCategory, type PropertyListing } from '@/dummy/listings-mock';

type FeedMode = 'listings' | 'roommates';

export function DiscoverHomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PropertyCategory | 'All'>('All');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [feedHeight, setFeedHeight] = useState(0);
  const [mode, setMode] = useState<FeedMode>('listings');
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roommateQuery, setRoommateQuery] = useState('');
  const listRef = useRef<FlatList<PropertyListing>>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentIndex > 0) {
        listRef.current?.scrollToIndex({ index: 0, animated: true });
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [currentIndex]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1300);
  }, []);

  const onViewListing = useCallback(
    (id: string) => router.push(`/property/${id}`),
    [router],
  );

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return discoverListings.filter((listing) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${listing.title} ${listing.location} ${listing.category}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeCategory === 'All' || listing.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory]);

  const toggleLike = useCallback((id: string) => {
    setLikedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onFeedLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setFeedHeight(h);
  }, []);

  const handleSelectMode = useCallback((m: FeedMode) => {
    setMode(m);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <AuthBackgroundBubbles />
        <View style={styles.flex}>
          <View style={styles.feedContainer} onLayout={onFeedLayout}>
            {feedHeight > 0 && mode === 'listings' && filteredListings.length > 0 && (
              <DiscoverListingFeed
                ref={listRef}
                listings={filteredListings}
                likedIds={likedIds}
                onToggleLike={toggleLike}
                onViewListing={onViewListing}
                itemHeight={feedHeight}
                refreshing={refreshing}
                onRefresh={onRefresh}
                onIndexChange={setCurrentIndex}
              />
            )}
            {mode === 'listings' && filteredListings.length === 0 && (
              <NoResultsFoundScreen
                query={query}
                onQueryChange={setQuery}
                onAdjustFilters={() => setFiltersOpen((open) => !open)}
                onRefresh={onRefresh}
                refreshing={refreshing}
                showSearchBar={false}
              />
            )}
            {feedHeight > 0 && mode === 'roommates' && (
              <RoommateDeck itemHeight={feedHeight} query={roommateQuery} onQueryChange={setRoommateQuery} />
            )}
          </View>

          {mode === 'listings' ? (
            <DiscoverFeedHeader
              query={query}
              onQueryChange={setQuery}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((open) => !open)}
              categories={discoverFilters}
              activeCategory={activeCategory}
              onCategoryChange={(value: string) => setActiveCategory(value as PropertyCategory | 'All')}
            />
          ) : (
            <DiscoverFeedHeader
              query={roommateQuery}
              onQueryChange={setRoommateQuery}
              filtersOpen={false}
              onToggleFilters={() => {}}
              searchPlaceholder="Search by name, uni, or keyword..."
            />
          )}

          <DiscoverBottomNav />
        </View>

        <FeedModeSelector
          currentMode={mode}
          onSelectMode={handleSelectMode}
          onDismiss={() => {}}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  flex: {
    flex: 1,
  },
  feedContainer: {
    flex: 1,
  },
});
