import { useState } from 'react';
import { router } from 'expo-router';

import { useCreditForListing } from '@/hooks/use-liquidity';
import { usePendingInvitationForListing } from '@/hooks/use-lodge-invitations';
import type { DbListing, FeedListing } from '@/types/feed-listing';
import { resolveBarSummary } from '@/utils/property-bar-summary';
import { canCancelStatus } from '@/utils/credit-status';
import { isCreditPaid, resolvePropertyCta } from '@/utils/property-cta';

/** Everything the property page's bottom bar needs: what to say, what pressing it does, and its modals. */
export function usePropertyCta(property: FeedListing, dbListing?: DbListing, spotsLeft?: number) {
  const { data: credit, isLoading: isCheckingCredit } = useCreditForListing(property.id);
  const { data: invitation, isLoading: isLoadingInvitation } = usePendingInvitationForListing(property.id);
  const [claimOpen, setClaimOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const isLoading = isCheckingCredit || isLoadingInvitation;
  // The state is only known once both queries settle; until then the button shows a spinner.
  const isPending = isLoading && !credit && !invitation;
  const cta = resolvePropertyCta({
    credit,
    hasInvitation: !!invitation,
    isLoading,
    isSingleOccupancy: dbListing?.max_roommates === 1,
    isFull: spotsLeft !== undefined && spotsLeft <= 0,
  });
  const summary = resolveBarSummary({
    cta,
    pricePerPerson: property.pricePerPerson,
    targetOccupancy: credit?.target_occupancy,
    paymentDeadline: credit?.payment_deadline,
  });

  const onPress = () => {
    const { action } = cta;
    switch (action.type) {
      case 'claim': return setClaimOpen(true);
      case 'solo-claim': return router.push(`/property/solo-claim?id=${property.id}`);
      case 'view-booking': return router.push(`/property/booking?id=${action.creditId}`);
      case 'open-household': return router.push({ pathname: '/property/lobby', params: { creditId: action.creditId } });
      case 'pay': return router.push(`/property/pay-slot?id=${action.creditId}`);
      case 'open-invite': return setInviteOpen(true);
      case 'cancel': return setCancelOpen(true);
      case 'browse': return router.push('/(tabs)');
      case 'none': return undefined;
    }
  };

  return {
    cta,
    summary,
    onPress,
    isPending,
    isPaid: isCreditPaid(credit),
    invitation: invitation ?? null,
    claimOpen,
    closeClaim: () => setClaimOpen(false),
    inviteOpen,
    closeInvite: () => setInviteOpen(false),
    creditId: credit?.id ?? null,
    canCancel: canCancelStatus(credit?.status),
    cancelOpen,
    openCancel: () => setCancelOpen(true),
    closeCancel: () => setCancelOpen(false),
  };
}
