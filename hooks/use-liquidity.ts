import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEstates,
  purchaseSlotCredit,
  fetchUserSlotCredits,
  fetchActivePods,
} from '@/services/liquidity-service';
import { markSlotCreditPaid, expireSlotCredit } from '@/services/liquidity-payment-service';
import type { PurchaseSlotCreditInput, PurchaseSlotCreditResult } from '@/services/liquidity-service';
import type { Estate, SlotCredit, Pod } from '@/types/liquidity';

export function useEstates() {
  return useQuery<Estate[], Error>({
    queryKey: ['estates'],
    queryFn: fetchEstates,
    staleTime: 60_000,
  });
}

export function useUserSlotCredits() {
  return useQuery<SlotCredit[], Error>({
    queryKey: ['user-slot-credits'],
    queryFn: fetchUserSlotCredits,
    staleTime: 30_000,
  });
}

export function useCreditForListing(listingId?: string) {
  const { data: credits, isLoading } = useUserSlotCredits();
  const credit = credits?.find((c) => c.listing_id === listingId);
  return { data: credit, isLoading };
}

export function useActivePods(estateId?: string) {
  return useQuery<Pod[], Error>({
    queryKey: ['active-pods', estateId],
    queryFn: () => fetchActivePods(estateId),
    staleTime: 30_000,
  });
}

export function useCreateSlotCredit() {
  const queryClient = useQueryClient();

  return useMutation<PurchaseSlotCreditResult, Error, PurchaseSlotCreditInput>({
    mutationFn: (input) => purchaseSlotCredit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-slot-credits'] });
      queryClient.invalidateQueries({ queryKey: ['active-pods'] });
    },
    onError: (error) => {
      console.error('[useCreateSlotCredit] Mutation failed:', error);
    },
  });
}

export function useMarkSlotCreditPaid() {
  const queryClient = useQueryClient();

  return useMutation<SlotCredit | null, Error, string>({
    mutationFn: (creditId) => markSlotCreditPaid(creditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-slot-credits'] });
    },
    onError: (error) => {
      console.error('[useMarkSlotCreditPaid] Mutation failed:', error);
    },
  });
}

export function useExpireSlotCredit() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, string>({
    mutationFn: (creditId) => expireSlotCredit(creditId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-slot-credits'] });
    },
    onError: (error) => {
      console.error('[useExpireSlotCredit] Mutation failed:', error);
    },
  });
}
