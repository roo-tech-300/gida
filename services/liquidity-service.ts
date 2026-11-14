import { ENDED_STATUS_FILTER, isEndedStatus } from '@/utils/credit-status';
import { supabase } from '@/lib/supabase';
import { ALREADY_RESERVED_MESSAGE, hasActiveBooking } from '@/services/booking-guard-service';
import { derivePropertyTier, isValidTargetOccupancy } from '@/utils/liquidity-math';
import { resolveEstateForListing } from '@/utils/liquidity-estate';
import { currentUserId, findPodByGroupCode, joinPodByCode, createFounderCredit, removeMemberFromPod, SIGN_IN_REQUIRED_MESSAGE } from '@/services/liquidity-pod-service';
import type { PurchaseSlotCreditResult, InvitedFriend } from '@/services/liquidity-pod-service';
import { sendRoommateInviteDm } from '@/services/roommate-invite-message';
import type { Estate, SlotCredit, Pod } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';
import { MOCK_ESTATES } from '@/dummy/liquidity-mock';
export { fetchActivePods, fetchOpenPodsForListing, fetchPodInvitations } from '@/services/liquidity-pod-queries';

export { findPodByGroupCode, removeMemberFromPod };
export type { PurchaseSlotCreditResult };

export type PurchaseSlotCreditInput = {
  listing: DbListing;
  targetOccupancy: number;
  createCode?: string;
  joinCode?: string;
  invitedFriends?: InvitedFriend[];
  source?: 'code' | 'recommendation';
  creatorGender?: 'MALE' | 'FEMALE' | null;
};

export async function findUserCreditForProperty(userId: string | null, listingId: string): Promise<SlotCredit | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .not('status', 'in', ENDED_STATUS_FILTER)
      .maybeSingle();
    if (!error && data) return data as SlotCredit;
  } catch (error) {
    console.error('[LiquidityService] Failed to look up existing credit:', error);
  }
  return null;
}

export async function purchaseSlotCredit(input: PurchaseSlotCreditInput): Promise<PurchaseSlotCreditResult> {
  console.log('[LiquidityService] purchaseSlotCredit called — listingId:', input.listing.id, 'targetOccupancy:', input.targetOccupancy, 'joinCode:', input.joinCode ?? 'none');
  const propertyTier = derivePropertyTier(input.listing.property_tier, input.listing.max_roommates);
  if (!isValidTargetOccupancy(propertyTier, input.targetOccupancy)) {
    console.error('[LiquidityService] Invalid occupancy:', input.targetOccupancy, 'for tier:', propertyTier);
    throw new Error(`Invalid occupancy ${input.targetOccupancy} for a ${propertyTier}-slot property.`);
  }

  const userId = await currentUserId();
  console.log('[LiquidityService] userId:', userId);
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  // Backend check first: the database rejects a second active booking for
  // this listing (expired bookings never block a new one).
  const activeBookingId = await hasActiveBooking(input.listing.id);
  if (activeBookingId) {
    console.log('[LiquidityService] Active booking on backend:', activeBookingId);
    throw new Error(ALREADY_RESERVED_MESSAGE);
  }

  const existing = await findUserCreditForProperty(userId, input.listing.id);
  console.log('[LiquidityService] Existing credit:', existing?.id ?? 'none', 'status:', existing?.status ?? 'n/a');
  if (existing && !isEndedStatus(existing.status)) {
    throw new Error(ALREADY_RESERVED_MESSAGE);
  }

  const { estateId, estate } = await resolveEstateForListing(input.listing);
  console.log('[LiquidityService] Resolved estate — estateId:', estateId);
  if (input.joinCode && input.joinCode.trim()) {
    console.log('[LiquidityService] Joining existing pod via code...');
    return joinPodByCode({ code: input.joinCode, listing: input.listing, estate, estateId, propertyTier, source: input.source });
  }
  console.log('[LiquidityService] Creating founder credit...');
  return createFounderCredit({ listing: input.listing, estate, estateId, propertyTier, targetOccupancy: input.targetOccupancy, createCode: input.createCode, invitedFriends: input.invitedFriends, creatorGender: input.creatorGender });
}

export async function fetchEstates(): Promise<Estate[]> {
  try {
    const { data, error } = await supabase.from('estates').select('*');
    if (error || !data || data.length === 0) {
      return MOCK_ESTATES;
    }
    return data as Estate[];
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch estates from Supabase, using fallback:', error);
    return MOCK_ESTATES;
  }
}

export async function fetchUserSlotCredits(): Promise<SlotCredit[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .select('*, estate:estates(*)')
      .eq('user_id', userId);
    if (error || !data) {
      return [];
    }

    // Fetch pod verification status via pod_members join
    const creditIds = data.map((r) => r.id).filter(Boolean);
    let podVerificationByCreditId = new Map<string, string>();
    if (creditIds.length > 0) {
      const { data: memberships } = await supabase
        .from('pod_members')
        .select('slot_credit_id, pod_id')
        .eq('user_id', userId)
        .in('slot_credit_id', creditIds);
      if (memberships && memberships.length > 0) {
        const podIds = [...new Set(memberships.map((m) => m.pod_id).filter(Boolean))];
        if (podIds.length > 0) {
          const { data: pods } = await supabase
            .from('pods')
            .select('id, verification_status')
            .in('id', podIds);
          if (pods) {
            const podStatusById = new Map(pods.map((p) => [p.id, p.verification_status]));
            for (const m of memberships) {
              const status = podStatusById.get(m.pod_id);
              if (status) podVerificationByCreditId.set(m.slot_credit_id, status);
            }
          }
        }
      }
    }

    return data.map((row) => ({
      ...row,
      pod_verification_status: podVerificationByCreditId.get(row.id) ?? null,
    })) as SlotCredit[];
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch user slot credits:', error);
    return [];
  }
}

export async function inviteRoommateToPod(podId: string | undefined, inviteeName: string, inviteeUserId?: string): Promise<Pod | null> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);
  if (!podId) throw new Error('No pod found to invite to.');

  const { error } = await supabase.from('pod_invitations').insert({
    pod_id: podId,
    inviter_user_id: userId,
    invitee_user_id: inviteeUserId ?? null,
    invitee_name: inviteeName,
  });
  if (error) throw new Error(error.message);

  if (inviteeUserId) {
    try {
      const { data: pod } = await supabase.from('pods').select('listing_id').eq('id', podId).maybeSingle();
      if (pod?.listing_id) {
        const [{ data: listing }, { data: inviterProfile }] = await Promise.all([
          supabase.from('listings').select('*').eq('id', pod.listing_id).maybeSingle(),
          supabase.from('profiles').select('gender').eq('id', userId).maybeSingle(),
        ]);
        if (listing) {
          await sendRoommateInviteDm({
            inviterUserId: userId,
            inviteeUserId,
            listing: listing as DbListing,
            inviterGender: inviterProfile?.gender ?? undefined,
          });
        }
      }
    } catch (dmError) {
      console.error('[LiquidityService] Failed to send roommate invite DM:', dmError);
    }
  }

  return null;
}
