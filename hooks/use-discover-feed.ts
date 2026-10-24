import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSavedPlaces } from '@/hooks/use-saved-places';
import { fetchPlaces, PLACES_QUERY_KEY, searchPlaces } from '@/services/places-service';
import type { PlaceCategory } from '@/types/place';

export type DiscoverCategoryFilter = PlaceCategory | 'all';

const SEARCH_DEBOUNCE_MS = 350;
const STALE_TIME_MS = 5 * 60_000;

export function useDiscoverFeed() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DiscoverCategoryFilter>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { ids: savedIds, toggle: toggleSaved } = useSavedPlaces();

  const isSearching = debouncedQuery.trim().length > 0;

  // Base list — full fetch when idle, server-side search when typing
  const {
    data: allPlaces = [],
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: isSearching
      ? [...PLACES_QUERY_KEY, 'search', debouncedQuery]
      : PLACES_QUERY_KEY,
    queryFn: () =>
      isSearching ? searchPlaces(debouncedQuery) : fetchPlaces(),
    staleTime: STALE_TIME_MS,
  });

  // Client-side filters applied on top of the server result
  const places = (() => {
    let result = allPlaces;
    if (!isSearching && category !== 'all') {
      result = result.filter((p) => p.category === category);
    }
    if (savedOnly) {
      result = result.filter((p) => savedIds.includes(p.id));
    }
    return result;
  })();

  const trending = isSearching || category !== 'all' || savedOnly
    ? []
    : allPlaces.filter((p) => p.featured);

  const hasActiveFilters = isSearching || category !== 'all' || savedOnly;

  const refresh = useCallback(() => { void refetch(); }, [refetch]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('all');
    setSavedOnly(false);
  }, []);

  const toggleSavedOnly = useCallback(
    () => setSavedOnly((current) => !current),
    [],
  );

  return {
    query,
    setQuery,
    category,
    setCategory,
    savedOnly,
    toggleSavedOnly,
    savedCount: savedIds.length,
    savedIds,
    toggleSaved,
    places,
    trending,
    isLoading,
    isRefreshing: isRefetching,
    refresh,
    clearFilters,
    hasActiveFilters,
    isSearching,
    isError,
  };
}

export type DiscoverFeed = ReturnType<typeof useDiscoverFeed>;
