import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '@/services/review-service';
import type { CreateReviewPayload } from '@/types/reviews';

export function useCreateReview(listingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      return createReview(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', listingId] });
      queryClient.invalidateQueries({ queryKey: ['review-summary', listingId] });
      queryClient.invalidateQueries({ queryKey: ['review-eligibility', listingId] });
    },
  });
}
