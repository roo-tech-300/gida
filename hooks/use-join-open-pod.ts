import { useCallback } from 'react';
import { router } from 'expo-router';

import { useAppToast } from '@/components/ui/toast-card';
import type { useCreateSlotCredit } from '@/hooks/use-liquidity';
import type { DbListing } from '@/types/feed-listing';
import type { Pod } from '@/types/liquidity';
import { getErrorMessage } from '@/utils/error-message';

type PurchaseSlot = ReturnType<typeof useCreateSlotCredit>['mutateAsync'];

/** Joins an existing open pod from the claim modal, then continues to payment. */
export function useJoinOpenPod(listing: DbListing | undefined, purchaseSlot: PurchaseSlot, onClose: () => void) {
  const { showToast } = useAppToast();

  return useCallback(
    async (pod: Pod) => {
      if (!listing || !pod.group_code) return;
      try {
        const { credit } = await purchaseSlot({
          listing,
          targetOccupancy: pod.target_occupancy,
          joinCode: pod.group_code,
          source: 'recommendation',
        });
        showToast({ message: `You're in! Seat ${pod.current_total_intent + 1} of ${pod.target_occupancy} is yours.`, type: 'success' });
        onClose();
        router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
      } catch (error: unknown) {
        console.error('[ClaimModal] Failed to join open pod:', error);
        showToast({ message: getErrorMessage(error, 'Failed to join the group.'), type: 'error' });
      }
    },
    [listing, purchaseSlot, showToast, onClose],
  );
}
