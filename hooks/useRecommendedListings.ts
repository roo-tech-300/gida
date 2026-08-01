import { useQuery } from '@tanstack/react-query';
import { fetchRecommendedListings } from '@/services/recommendedListingsService';

export function useRecommendedListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['recommended-listings', userId],
    queryFn: () => fetchRecommendedListings(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
