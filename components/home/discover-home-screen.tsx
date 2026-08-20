import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { DesignColors } from '@/constants/design';

import { AuthBackgroundBubbles } from '@/components/auth/auth-background-bubbles';
import { DiscoverBottomNav } from '@/components/home/discover-bottom-nav';
import { DiscoverListingFeed } from '@/components/home/discover-listing-feed';
import { FeedModeSelector, type FeedModeSelectorRef } from '@/components/home/feed-mode-selector';
import { HomeSearchBar } from '@/components/home/home-search-bar';
import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { NoResultsFoundScreen } from '@/components/ui/no-results-found-screen';
import { RoommateDeck } from '@/components/home/roommate-deck';
import { SearchScreen, type SearchScreenRef } from '@/components/search/search-screen';
import { useRecommendedListings } from '@/hooks/useRecommendedListings';
import { useListings } from '@/hooks/use-listings';
import { useSavedIds, useToggleSave } from '@/hooks/use-saved-listings';
import { useAuth } from '@/context/auth-context';
import type { FeedListing } from '@/types/feed-listing';

type FeedMode = 'listings' | 'roommates';

export function DiscoverHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const recommended = useRecommendedListings(profile?.id);
  const fallback = useListings();

  const useRecommended = recommended.data && recommended.data.length > 0;
  const listings = useRecommended ? recommended.data! : fallback.data ?? [];
  const isLoading = useRecommended ? recommended.isLoading : fallback.isLoading;
  const isRefetching = useRecommended ? recommended.isRefetching : fallback.isRefetching;
  const refetch = useRecommended ? recommended.refetch : fallback.refetch;
  const isError = useRecommended ? recommended.isError : fallback.isError;
  const { data: savedIds = [] } = useSavedIds();
  const { mutate: toggleSave } = useToggleSave();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [feedHeight, setFeedHeight] = useState(0);
  const [mode, setMode] = useState<FeedMode>('listings');
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef<FlatList<FeedListing>>(null);
  const modeSelectorRef = useRef<FeedModeSelectorRef>(null);
  const searchScreenRef = useRef<SearchScreenRef>(null);

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

  const scrollOffsetRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (scrollOffsetRef.current > 0 && listRef.current) {
        listRef.current.scrollToOffset({ offset: scrollOffsetRef.current, animated: false });
      }
    }, []),
  );

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const onViewListing = useCallback(
    (id: string) => router.push(`/property/${id}`),
    [router],
  );

  const openSearch = useCallback(() => {
    searchScreenRef.current?.open();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => activeCategory === 'All' || listing.category === activeCategory);
  }, [activeCategory, listings]);

  const likedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const onFeedLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setFeedHeight(h);
  }, []);

  const handleSelectMode = useCallback((m: FeedMode) => {
    setMode(m);
  }, []);

  if (isError && !isLoading && mode === 'listings') {
    return <NetworkErrorScreen onRetry={onRefresh} />;
  }

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
                onScrollOffsetChange={(offset) => { scrollOffsetRef.current = offset; }}
              />
            )}
            {isLoading && mode === 'listings' && (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={DesignColors.primary} />
              </View>
            )}
            {mode === 'listings' && filteredListings.length === 0 && !isLoading && (
              <NoResultsFoundScreen
                query=""
                onQueryChange={() => {}}
                onAdjustFilters={() => setFiltersOpen((open) => !open)}
                onRefresh={onRefresh}
                refreshing={isRefetching}
                showSearchBar={false}
              />
            )}
            {feedHeight > 0 && mode === 'roommates' && (
              <RoommateDeck itemHeight={feedHeight} query="" onQueryChange={() => {}} />
            )}
          </View>

          {mode === 'listings' ? (
            <HomeSearchBar
              hasFilter
              onFilterPress={() => setFiltersOpen((open) => !open)}
              currentMode={mode}
              onSwipeDown={openModeSelector}
              onOpenSearch={openSearch}
              filtersOpen={filtersOpen}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          ) : (
            <HomeSearchBar
              placeholder="Search by name, uni, or keyword..."
              currentMode={mode}
              onSwipeDown={openModeSelector}
              onOpenSearch={openSearch}
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

        <SearchScreen
          ref={searchScreenRef}
          onPressListing={onViewListing}
          onPressRoommate={(id) => router.push(`/roommate/${id}`)}
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
    backgroundColor: DesignColors.surfaceContainerLowest,
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
