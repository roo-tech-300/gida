import { useCallback } from 'react';
import { router } from 'expo-router';

import type { SelectedFriend } from '@/components/claim/friend-picker';
import { useAppToast } from '@/components/ui/toast-card';
import { useCreateSlotCredit } from '@/hooks/use-liquidity';
import { notifyAdminOfReservation } from '@/services/lodge-reservation-notify';
import type { DbListing } from '@/types/feed-listing';

type Args = {
  listing?: DbListing;
  isBuyout: boolean;
  matchedCount: number;
  peopleTotal: number;
  inviteCode: string;
  friends: SelectedFriend[];
  creatorGender?: 'MALE' | 'FEMALE' | null;
  creatorName?: string;
  /** Called once the credit exists, before navigating to payment. */
  onReserved: () => void;
};

/**
 * Reserving a spot from the claim wizard: buys the slot credit, tells the
 * admin about a newly created pod, then hands off to payment.
 */
export function useReserveClaimSpot({
  listing,
  isBuyout,
  matchedCount,
  peopleTotal,
  inviteCode,
  friends,
  creatorGender,
  creatorName,
  onReserved,
}: Args) {
  const { mutateAsync: purchaseSlot, isPending } = useCreateSlotCredit();
  const { showToast } = useAppToast();

  const reserve = useCallback(async () => {
    if (!listing) return;

    try {
      const { credit, podId, created } = await purchaseSlot({
        listing,
        targetOccupancy: peopleTotal,
        createCode: inviteCode,
        invitedFriends: friends.map((friend) => ({ id: friend.id, name: friend.name })),
        creatorGender,
      });

      const message = isBuyout
        ? 'Spot reserved! You\'re all set for solo living.'
        : matchedCount > 0
          ? `Spot secured! Gida will find ${matchedCount} roommate${matchedCount === 1 ? '' : 's'} for you.`
          : 'Spot secured! Invite your friends to keep the group together.';
      showToast({ message, type: 'success' });

      if (created) {
        try {
          await notifyAdminOfReservation({
            podId,
            listingId: listing.id,
            creditId: credit.id,
            userName: creatorName ?? 'A resident',
          });
        } catch (notifyError) {
          console.error('[ClaimModal] Failed to notify admin of the new pod:', notifyError);
        }
      }

      onReserved();
      router.push({ pathname: '/property/pay-slot', params: { id: credit.id } });
    } catch (error) {
      console.error('[ClaimModal] Failed to reserve spot:', error);
      showToast({
        message: error instanceof Error ? error.message : 'Failed to reserve spot.',
        type: 'error',
      });
    }
  }, [
    listing,
    peopleTotal,
    inviteCode,
    friends,
    creatorGender,
    isBuyout,
    matchedCount,
    showToast,
    creatorName,
    onReserved,
    purchaseSlot,
  ]);

  return { reserve, isReserving: isPending };
}
