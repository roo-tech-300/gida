import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query';

type PaginatedQueryOptions<T extends readonly unknown[]> = {
  queryKey: readonly unknown[];
  queryFn: (params: { from: number; to: number }) => Promise<T>;
  limit?: number;
  staleTime?: number;
  enabled?: boolean;
};

export function usePaginatedQuery<T extends readonly unknown[]>({
  queryKey,
  queryFn,
  limit = 10,
  staleTime = 5 * 60 * 1000,
  enabled = true,
}: PaginatedQueryOptions<T>) {
  return useInfiniteQuery<T, Error, InfiniteData<T, number>, readonly unknown[], number>({
    queryKey,
    queryFn: ({ pageParam = 0 }) => {
      const from = pageParam * limit;
      const to = from + limit - 1;

      return queryFn({ from, to });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!Array.isArray(lastPage)) return undefined;
      return lastPage.length < limit ? undefined : allPages?.length ?? 0;
    },
    staleTime,
    enabled,
  });
}