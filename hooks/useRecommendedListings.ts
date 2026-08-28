import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { fetchRecommendedListings } from '@/services/recommendedListingsService';

export function useRecommendedListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['recommended-listings', userId],
    queryFn: () => fetchRecommendedListings(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useInfiniteRecommendedListings(userId: string | undefined, limit = 10) {
  return useInfiniteQuery({
    queryKey: ['infinite-recommended-listings', userId],
    queryFn: ({ pageParam = 0 }) => {
      return fetchRecommendedListings(userId!, pageParam, limit);
    },
    enabled: !!userId,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < limit ? undefined : allPages.length;
    },
    staleTime: 5 * 60 * 1000,
  });
}
