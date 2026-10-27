import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSavedPlaces } from '@/hooks/use-saved-places';
import { fetchPlaces, PAGE_SIZE, PLACES_QUERY_KEY, searchPlaces } from '@/services/places-service';
import type { Place, PlaceCategory } from '@/types/place';

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

  const {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    Place[],
    Error,
    InfiniteData<Place[], number>,
    readonly unknown[],
    number
  >({
    queryKey: isSearching
      ? [...PLACES_QUERY_KEY, 'search', debouncedQuery]
      : PLACES_QUERY_KEY,
    queryFn: ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      return isSearching
        ? searchPlaces(debouncedQuery, { from, to })
        : fetchPlaces({ from, to });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    staleTime: STALE_TIME_MS,
  });

  // Flatten pages into a single list
  const allPlaces = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  // Client-side filters on top of the paginated result
  const places = useMemo(() => {
    let result = allPlaces;
    if (!isSearching && category !== 'all') {
      result = result.filter((p) => p.category === category);
    }
    if (savedOnly) {
      result = result.filter((p) => savedIds.includes(p.id));
    }
    return result;
  }, [allPlaces, category, isSearching, savedIds, savedOnly]);

  const trending = useMemo(
    () =>
      isSearching || category !== 'all' || savedOnly
        ? []
        : allPlaces.filter((p) => p.featured),
    [allPlaces, category, isSearching, savedOnly],
  );

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
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}

export type DiscoverFeed = ReturnType<typeof useDiscoverFeed>;
