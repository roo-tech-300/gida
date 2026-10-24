import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { PLACE_CATEGORY_MAP } from '@/constants/place-categories';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useSavedPlaces } from '@/hooks/use-saved-places';
import { fetchPlaces, PLACES_QUERY_KEY } from '@/services/places-service';
import type { PlaceCategory } from '@/types/place';

export type DiscoverCategoryFilter = PlaceCategory | 'all';

const SEARCH_DEBOUNCE_MS = 300;
const STALE_TIME_MS = 5 * 60_000;

export function useDiscoverFeed() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DiscoverCategoryFilter>('all');
  const [savedOnly, setSavedOnly] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const { ids: savedIds, toggle: toggleSaved } = useSavedPlaces();

  const { data = [], isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: PLACES_QUERY_KEY,
    queryFn: fetchPlaces,
    staleTime: STALE_TIME_MS,
  });

  const places = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    return data.filter((place) => {
      if (category !== 'all' && place.category !== category) return false;
      if (savedOnly && !savedIds.includes(place.id)) return false;
      if (!term) return true;
      const haystack = [
        place.name,
        place.area,
        place.city,
        PLACE_CATEGORY_MAP[place.category].label,
        ...place.tags,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [category, data, debouncedQuery, savedIds, savedOnly]);

  const isSearching = debouncedQuery.trim().length > 0;

  const trending = useMemo(() => {
    if (isSearching || category !== 'all' || savedOnly) return [];
    return data.filter((place) => place.featured);
  }, [category, data, isSearching, savedOnly]);

  const hasActiveFilters = isSearching || category !== 'all' || savedOnly;

  const refresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('all');
    setSavedOnly(false);
  }, []);

  const toggleSavedOnly = useCallback(() => setSavedOnly((current) => !current), []);

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
