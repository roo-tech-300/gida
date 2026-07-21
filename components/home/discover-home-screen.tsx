import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DesignColors } from '@/constants/design';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DiscoverListingFeed } from '@/components/home/discover-listing-feed';
import { FeedModeSelector, type FeedModeSelectorRef } from '@/components/home/feed-mode-selector';
import { HomeSearchBar } from '@/components/home/home-search-bar';
import { NoResultsFoundScreen } from '@/components/ui/no-results-found-screen';
import { RoommateDeck } from '@/components/home/roommate-deck';
import { useListings } from '@/hooks/use-listings';
import { useSavedIds, useToggleSave } from '@/hooks/use-saved-listings';
import type { FeedListing } from '@/types/feed-listing';

type FeedMode = 'listings' | 'roommates';

export function DiscoverHomeScreen() {
  const router = useRouter();
  const { data: listings = [], isLoading, isRefetching, refetch } = useListings();
  const { data: savedIds = [] } = useSavedIds();
  const { mutate: toggleSave } = useToggleSave();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [feedHeight, setFeedHeight] = useState(0);
  const [mode, setMode] = useState<FeedMode>('listings');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roommateQuery, setRoommateQuery] = useState('');
  const listRef = useRef<FlatList<FeedListing>>(null);
  const modeSelectorRef = useRef<FeedModeSelectorRef>(null);

  const categories = useMemo(() => {
    const set = new Set(listings.map((l) => l.category).filter(Boolean));
    return Array.from(set);
  }, [listings]);

  useEffect(() => {
    listings.forEach((l) => {
      if (l.image) Image.prefetch(l.image);
    });
  }, [listings]);

  const openModeSelector = useCallback(() => {
    modeSelectorRef.current?.open();
  }, []);

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
    refetch();
  }, [refetch]);

  const onViewListing = useCallback(
    (id: string) => router.push(`/property/${id}`),
    [router],
  );

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return listings.filter((listing) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${listing.title} ${listing.location} ${listing.category}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeCategory === 'All' || listing.category === activeCategory;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategory, listings]);

  const likedSet = useMemo(() => new Set(savedIds), [savedIds]);

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
                likedIds={likedSet}
                onToggleLike={toggleSave}
                onViewListing={onViewListing}
                itemHeight={feedHeight}
                refreshing={isRefetching}
                onRefresh={onRefresh}
                onIndexChange={setCurrentIndex}
              />
            )}
            {isLoading && mode === 'listings' && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={DesignColors.primary} />
              </View>
            )}
            {mode === 'listings' && filteredListings.length === 0 && !isLoading && (
              <NoResultsFoundScreen
                query={query}
                onQueryChange={setQuery}
                onAdjustFilters={() => setFiltersOpen((open) => !open)}
                onRefresh={onRefresh}
                refreshing={isRefetching}
                showSearchBar={false}
              />
            )}
            {feedHeight > 0 && mode === 'roommates' && (
              <RoommateDeck itemHeight={feedHeight} query={roommateQuery} onQueryChange={setRoommateQuery} />
            )}
          </View>

          {mode === 'listings' ? (
            <HomeSearchBar
              value={query}
              onChangeText={setQuery}
              hasFilter
              onFilterPress={() => setFiltersOpen((open) => !open)}
              currentMode={mode}
              onSwipeDown={openModeSelector}
              filtersOpen={filtersOpen}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          ) : (
            <HomeSearchBar
              value={roommateQuery}
              onChangeText={setRoommateQuery}
              placeholder="Search by name, uni, or keyword..."
              currentMode={mode}
              onSwipeDown={openModeSelector}
            />
          )}

          <DiscoverBottomNav />
        </View>

        <FeedModeSelector
          ref={modeSelectorRef}
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
