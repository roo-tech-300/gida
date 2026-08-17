import { useQuery } from '@tanstack/react-query';
import { fetchReviewsForListing } from '@/services/review-service';
import type { Review } from '@/types/reviews';

export function useReviews(listingId: string) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      const reviews = await fetchReviewsForListing(listingId);
      return reviews;
    },
    enabled: !!listingId,
  });
}

export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}
