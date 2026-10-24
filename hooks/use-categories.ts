import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteQuery, useQuery, type InfiniteData } from '@tanstack/react-query';

import { fetchCategories, searchCategories, type DbPlaceCategory } from '@/services/category-service';

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_CHARS = 2;

export function useInfiniteCategories(limit = 12) {
  return useInfiniteQuery<
    DbPlaceCategory[],
    Error,
    InfiniteData<DbPlaceCategory[], number>,
    readonly unknown[],
    number
  >({
    queryKey: ['infinite-categories'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * limit;
      const to = from + limit - 1;
      return fetchCategories({ from, to });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < limit ? undefined : allPages.length,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategorySearch(query: string) {
  const debounced = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  return useQuery<DbPlaceCategory[], Error>({
    queryKey: ['search-categories', debounced],
    queryFn: () => searchCategories(debounced),
    enabled: debounced.trim().length >= SEARCH_MIN_CHARS,
    staleTime: 15_000,
  });
}
