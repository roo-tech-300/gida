import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUnlockedListingIds, verifyLocationPayment, type VerifyPaymentResult } from '@/services/location-access-service';

export function useUnlockedListings() {
  return useQuery<string[], Error>({
    queryKey: ['location-access'],
    queryFn: fetchUnlockedListingIds,
    staleTime: 30_000,
  });
}

export function useVerifyLocationPayment() {
  const queryClient = useQueryClient();

  return useMutation<VerifyPaymentResult, Error, string>({
    mutationFn: (reference) => verifyLocationPayment(reference),
    onSuccess: (result) => {
      if (result.unlocked) {
        queryClient.invalidateQueries({ queryKey: ['location-access'] });
      }
    },
    onError: (error) => {
      console.error('[useVerifyLocationPayment] Mutation failed:', error);
    },
  });
}
