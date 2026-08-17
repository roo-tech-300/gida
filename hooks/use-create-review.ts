import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '@/services/review-service';
import type { CreateReviewPayload } from '@/types/reviews';
import { useAuth } from '@/context/auth-context';

export function useCreateReview(listingId: string) {
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: CreateReviewPayload) => {
      if (!profile) throw new Error('User not authenticated');
      return createReview({ ...payload, user_id: profile.id });
    },
    onSuccess: () => {
      // Invalidate reviews query to refetch
      queryClient.invalidateQueries({ queryKey: ['reviews', listingId] });
    },
  });
}
