import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { NetworkErrorScreen } from '@/components/ui/network-error-screen';
import { SearchScreen, type SearchScreenRef } from '@/components/search/search-screen';
import { DesignColors, DesignSpacing } from '@/constants/design';
import { useDiscoverPlaces } from '@/hooks/use-discover-places';
import { useFillFilteredFeed } from '@/hooks/use-fill-filtered-feed';
import { usePlaceFilters } from '@/hooks/use-place-filters';
import { useSavedIds, useToggleSave } from '@/hooks/use-saved-listings';
import { activeFilterCount, applyPlaceFilters } from '@/utils/place-filters';

import { DiscoverHeader } from './discover-header';
import { DiscoverSearchField } from './discover-search-field';
import type { FeedMode } from './feed-segmented';
import { PlaceFilterButton } from './place-filter-button';
import { PlaceFiltersSheet } from './place-filters-sheet';
import { PlacesFeed } from './places-feed';
import { PeopleGrid } from './people-grid';

const SEARCH_PLACEHOLDER = 'Search Bosso, Gidan Kwano, a lodge…';
const PEOPLE_PLACEHOLDER = 'Search by name, level or interest…';

export function DiscoverHomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<FeedMode>('places');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<SearchScreenRef>(null);

  const places = useDiscoverPlaces();
  const { filters, update, clear } = usePlaceFilters();
  const { data: savedIds = [] } = useSavedIds();
  const { mutate: toggleSave } = useToggleSave();

  const likedIds = useMemo(() => new Set(savedIds), [savedIds]);
  const visible = useMemo(() => applyPlaceFilters(places.listings, filters), [places.listings, filters]);
  const filterCount = activeFilterCount(filters);
  useFillFilteredFeed({
    hasActiveFilters: filterCount > 0,
    visibleCount: visible.length,
    hasMore: places.hasMore,
    isFetching: places.isFetchingMore || places.isLoading,
    pageCount: places.pageCount,
    loadMore: places.loadMore,
  });

  const openSearch = useCallback(() => searchRef.current?.open(), []);
  const openListing = useCallback((id: string) => router.push(`/property/${id}`), [router]);
  const refresh = useCallback(() => { void places.refetch(); }, [places]);

  if (places.isError && !places.isLoading && mode === 'places') {
    return <NetworkErrorScreen onRetry={refresh} />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DiscoverHeader savedCount={savedIds.length} onOpenSaved={() => router.push('/saved')} mode={mode} onModeChange={setMode} />

      {mode === 'places' ? (
        <View style={styles.flex}>
          {/* One compact row: search plus a filter button (filters live in a sheet). */}
          <View style={styles.pinned}>
            <DiscoverSearchField
              placeholder={SEARCH_PLACEHOLDER}
              onPress={openSearch}
              trailing={<PlaceFilterButton count={filterCount} onPress={() => setFiltersOpen(true)} />}
            />
          </View>
          <PlaceFiltersSheet
            visible={filtersOpen}
            filters={filters}
            resultCount={visible.length}
            onChange={update}
            onClear={clear}
            onClose={() => setFiltersOpen(false)}
          />
          <PlacesFeed
            listings={visible}
            likedIds={likedIds}
            isLoading={places.isLoading}
            isRefetching={places.isRefetching}
            isFetchingMore={places.isFetchingMore}
            hasActiveFilters={filterCount > 0}
            onToggleLike={toggleSave}
            onOpen={openListing}
            onRefresh={refresh}
            onEndReached={places.loadMore}
            onClearFilters={clear}
          />
        </View>
      ) : (
        <View style={styles.flex}>
          <PeopleGrid
            header={
              <View style={styles.headerStack}>
                <DiscoverSearchField placeholder={PEOPLE_PLACEHOLDER} onPress={openSearch} />
              </View>
            }
          />
        </View>
      )}

      <SearchScreen
        ref={searchRef}
        onPressListing={openListing}
        onPressRoommate={(id) => router.push(`/roommate/${id}`)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DesignColors.surfaceContainerLowest },
  flex: { flex: 1 },
  headerStack: { gap: DesignSpacing.md, paddingTop: DesignSpacing.md },
  pinned: { paddingTop: DesignSpacing.xs, paddingBottom: DesignSpacing.sm, backgroundColor: DesignColors.surfaceContainerLowest },
});
