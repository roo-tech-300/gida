import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getSavedItems, type SavedItem } from '@/services/saved-listing-service';

export type SavedFilter = 'all' | 'lodge' | 'place';
const PAGE_SIZE = 10;

export function useSavedFeed() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const [filter, setFilter] = useState<SavedFilter>('all');

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
    SavedItem[],
    Error,
    InfiniteData<SavedItem[], number>,
    readonly unknown[],
    number
  >({
    queryKey: ['saved-items', userId, filter],
    queryFn: ({ pageParam = 0 }) => {
      if (!userId) return Promise.resolve([]);
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      return getSavedItems(userId, filter, { from, to });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
    enabled: !!userId,
    staleTime: 2 * 60_000,
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data],
  );

  const refresh = useCallback(() => { void refetch(); }, [refetch]);

  return {
    items,
    filter,
    setFilter,
    isLoading,
    isRefreshing: isRefetching,
    isError,
    refresh,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
