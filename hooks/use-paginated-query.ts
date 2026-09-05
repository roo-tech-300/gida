import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

type PaginatedQueryOptions<T> = {
  queryKey: string[];
  queryFn: (params: { from: number; to: number }) => Promise<T>;
  limit?: number;
  staleTime?: number;
  enabled?: boolean;
};

export function usePaginatedQuery<T>({
  queryKey,
  queryFn,
  limit = 10,
  staleTime = 5 * 60 * 1000,
  enabled = true,
  ...rest
} : PaginatedQueryOptions<T>) {
  return useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * limit;
      const to = from + limit - 1;

      const { data, error } = await queryFn({ from, to });

      if (error) {
        console.error(
          `[usePaginatedQuery] Failed to fetch:`,
          error.message,
        );
        throw new Error(error.message);
      }

      return data ?? [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < limit ? undefined : allPages.length;
    },
    staleTime,
    enabled,
    ...rest,
  });
}