import { useQuery } from '@tanstack/react-query';
import { fetchReviewSummary, fetchReviewsForListing } from '@/services/review-service';
import type { Review, ReviewSummary } from '@/types/reviews';

export function useReviews(listingId: string) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      const reviews = await fetchReviewsForListing(listingId);
      return reviews;
    },
    enabled: !!listingId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}

export function useReviewSummary(listingId: string) {
  return useQuery<ReviewSummary>({
    queryKey: ['review-summary', listingId],
    queryFn: () => fetchReviewSummary(listingId),
    enabled: !!listingId,
    staleTime: 60_000,
    retry: 1,
  });
}
