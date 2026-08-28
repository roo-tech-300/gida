import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { acceptLodgeInvitation, fetchMyPendingInvitations, respondToLodgeInvitation } from '@/services/lodge-invitation-service';
import type { PurchaseSlotCreditResult } from '@/services/liquidity-pod-service';
import type { PendingLodgeInvitation } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';

export type LodgeInviteAction = 'accept' | 'decline';
export type LodgeInviteActionResult = PurchaseSlotCreditResult | null;
export type LodgeInviteActionInput = {
  invitation: PendingLodgeInvitation;
  action: LodgeInviteAction;
  listing?: DbListing;
};

export function useMyPendingInvitations() {
  return useQuery<PendingLodgeInvitation[], Error>({
    queryKey: ['my-lodge-invitations'],
    queryFn: fetchMyPendingInvitations,
    staleTime: 30_000,
  });
}

export function usePendingInvitationForListing(listingId?: string) {
  const { data: invitations = [], isLoading } = useMyPendingInvitations();
  const invitation = invitations.find((entry) => entry.pod.listing_id === listingId);
  return { data: invitation, isLoading };
}

export function useRespondToLodgeInvitation() {
  const queryClient = useQueryClient();

  return useMutation<LodgeInviteActionResult, Error, LodgeInviteActionInput>({
    mutationFn: async ({ invitation, action, listing }) => {
      if (action === 'accept') {
        return acceptLodgeInvitation(invitation, listing);
      }
      await respondToLodgeInvitation(invitation.id, 'declined');
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-lodge-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['user-slot-credits'] });
      queryClient.invalidateQueries({ queryKey: ['active-pods'] });
    },
    onError: (error) => {
      console.error('[useRespondToLodgeInvitation] Mutation failed:', error);
    },
  });
}
