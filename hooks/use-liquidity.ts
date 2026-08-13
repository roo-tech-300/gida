import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEstates,
  purchaseSlotCredit,
  fetchUserSlotCredits,
  fetchActivePods,
} from '@/services/liquidity-service';
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

export function useActivePods(estateId?: string) {
  return useQuery<Pod[], Error>({
    queryKey: ['active-pods', estateId],
    queryFn: () => fetchActivePods(estateId),
    staleTime: 30_000,
  });
}

export function useCreateSlotCredit() {
  const queryClient = useQueryClient();

  return useMutation<
    SlotCredit,
    Error,
    { estateId: string; propertyTier: number; intentSize: number; targetOccupancy: number }
  >({
    mutationFn: ({ estateId, propertyTier, intentSize, targetOccupancy }) =>
      purchaseSlotCredit(estateId, propertyTier, intentSize, targetOccupancy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-slot-credits'] });
      queryClient.invalidateQueries({ queryKey: ['active-pods'] });
    },
    onError: (error) => {
      console.error('[useCreateSlotCredit] Mutation failed:', error);
    },
  });
}
