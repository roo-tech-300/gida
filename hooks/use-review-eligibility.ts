import { useQuery } from '@tanstack/react-query';
import { fetchReviewEligibility } from '@/services/review-service';

export function useReviewEligibility(listingId: string) {
  return useQuery({
    queryKey: ['review-eligibility', listingId],
    queryFn: () => fetchReviewEligibility(listingId),
    enabled: !!listingId,
    staleTime: 60_000,
  });
}
