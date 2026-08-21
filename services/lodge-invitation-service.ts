import { supabase } from '@/lib/supabase';
import { derivePropertyTier, isValidTargetOccupancy } from '@/utils/liquidity-math';
import { resolveEstateForListing } from '@/utils/liquidity-estate';
import { currentUserId, joinPodByCode, SIGN_IN_REQUIRED_MESSAGE } from '@/services/liquidity-pod-service';
import type { PurchaseSlotCreditResult } from '@/services/liquidity-pod-service';
import type { PendingLodgeInvitation } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';

const POD_COLUMNS = 'id, group_code, listing_id, property_tier, target_occupancy, current_total_intent';

async function fetchDbListing(listingId: string): Promise<DbListing> {
  const { data, error } = await supabase.from('listings').select('*').eq('id', listingId).maybeSingle();
  if (error || !data) {
    console.error('[LodgeInvitations] Failed to load invited listing:', error?.message ?? 'not found');
    throw new Error("We couldn't load this lodge. Try again later.");
  }
  return data as DbListing;
}

export async function fetchMyPendingInvitations(): Promise<PendingLodgeInvitation[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('pod_invitations')
      .select(`*, pod:pods(${POD_COLUMNS})`)
      .eq('invitee_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[LodgeInvitations] Failed to fetch invitations:', error);
      return [];
    }
    return (data ?? []) as PendingLodgeInvitation[];
  } catch (error) {
    console.error('[LodgeInvitations] Exception while fetching invitations:', error);
    return [];
  }
}

export async function respondToLodgeInvitation(invitationId: string, status: 'accepted' | 'declined'): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);
  try {
    const { error } = await supabase
      .from('pod_invitations')
      .update({ status })
      .eq('id', invitationId)
      .eq('invitee_user_id', userId);
    if (error) console.error('[LodgeInvitations] Failed to update invitation:', error);
  } catch (error) {
    console.error('[LodgeInvitations] Exception while updating invitation:', error);
  }
}

export async function acceptLodgeInvitation(invitation: PendingLodgeInvitation, listing?: DbListing): Promise<PurchaseSlotCreditResult> {
  const userId = await currentUserId();
  if (!userId) throw new Error(SIGN_IN_REQUIRED_MESSAGE);

  const listingId = invitation.pod.listing_id;
  if (!listingId) throw new Error('This invite is missing its lodge details.');
  if (!invitation.pod.group_code) throw new Error('This invite is missing its group code.');

  const target = invitation.pod.target_occupancy || invitation.pod.property_tier;
  if (invitation.pod.current_total_intent + 1 > target) {
    throw new Error('This group is already full.');
  }

  const dbListing = listing ?? (await fetchDbListing(listingId));
  const propertyTier = derivePropertyTier(dbListing.property_tier, dbListing.max_roommates);
  if (!isValidTargetOccupancy(propertyTier, target)) {
    throw new Error(`Invalid occupancy ${target} for a ${propertyTier}-slot property.`);
  }

  const { estateId, estate } = await resolveEstateForListing(dbListing);
  const result = await joinPodByCode({ code: invitation.pod.group_code, listing: dbListing, estate, estateId, propertyTier });
  await respondToLodgeInvitation(invitation.id, 'accepted');
  return result;
}
