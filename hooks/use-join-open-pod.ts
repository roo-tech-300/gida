import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import type { DbListing } from '@/types/feed-listing';
import type { Pod, SlotCredit } from '@/types/liquidity';
import type { RecommendedPod } from '@/types/pod-recommendation';

type JoinTarget = {
  pod: Pod;
  listing: DbListing;
};

/**
 * Single path for taking an open seat in a forming pod, shared by the claim
 * wizard and the feed shelf.
 *
 * The joined pod is dropped from the cached recommendations immediately so it
 * cannot be tapped twice while payment is pending. Failures always invalidate
 * instead, because the usual cause is the group filling up under us.
 */
export function useJoinOpenPod() {
  const { mutateAsync: purchaseSlot, isPending } = useCreateSlotCredit();
  const queryClient = useQueryClient();
  const { showToast } = useAppToast();

  const joinPod = useCallback(
    async ({ pod, listing }: JoinTarget): Promise<SlotCredit | null> => {
      if (!pod.group_code) {
        showToast({ message: 'This group is not accepting new roommates.', type: 'error' });
        return null;
      }

      try {
        const { credit } = await purchaseSlot({
          listing,
          targetOccupancy: pod.target_occupancy,
          joinCode: pod.group_code,
          source: 'recommendation',
        });

        queryClient.setQueriesData<RecommendedPod[]>({ queryKey: ['recommended-pods'] }, (pods) =>
          pods ? pods.filter((cached) => cached.id !== pod.id) : pods,
        );
        showToast({
          message: `You're in! Seat ${pod.current_total_intent + 1} of ${pod.target_occupancy} is yours.`,
          type: 'success',
        });
        return credit;
      } catch (error) {
        console.error('[JoinOpenPod] Failed to join group:', error);
        showToast({
          message: error instanceof Error ? error.message : 'Failed to join the group.',
          type: 'error',
        });
        void queryClient.invalidateQueries({ queryKey: ['recommended-pods'] });
        return null;
      }
    },
    [purchaseSlot, queryClient, showToast],
  );

  return { joinPod, isJoining: isPending };
}
