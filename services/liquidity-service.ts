import { supabase } from '@/lib/supabase';
import { derivePropertyTier, isValidTargetOccupancy, verifyPodCompleteness } from '@/utils/liquidity-math';
import { resolveEstateForListing } from '@/utils/liquidity-estate';
import { currentUserId, findPodByGroupCode, joinPodByCode, createFounderCredit, removeMemberFromPod } from '@/services/liquidity-pod-service';
import type { PurchaseSlotCreditResult } from '@/services/liquidity-pod-service';
import { getLocalCredits, getLocalPods, upsertPod, resetLocalLiquidityState } from '@/services/liquidity-store';
import type { Estate, SlotCredit, Pod, PodMember, PodInvitation } from '@/types/liquidity';
import type { DbListing } from '@/types/feed-listing';
import { MOCK_ESTATES } from '@/dummy/liquidity-mock';

export { resetLocalLiquidityState, findPodByGroupCode, removeMemberFromPod };
export type { PurchaseSlotCreditResult };

export type PurchaseSlotCreditInput = {
  listing: DbListing;
  targetOccupancy: number;
  createCode?: string;
  joinCode?: string;
};

export async function findUserCreditForProperty(userId: string, listingId: string): Promise<SlotCredit | null> {
  if (userId === 'usr-current-student') {
    return getLocalCredits().find((c) => c.user_id === userId && c.listing_id === listingId) ?? null;
  }
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .select('*')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .maybeSingle();
    if (!error && data) return data as SlotCredit;
  } catch (error) {
    console.error('[LiquidityService] Failed to look up existing credit:', error);
  }
  return getLocalCredits().find((c) => c.user_id === userId && c.listing_id === listingId) ?? null;
}

export async function purchaseSlotCredit(input: PurchaseSlotCreditInput): Promise<PurchaseSlotCreditResult> {
  const propertyTier = derivePropertyTier(input.listing.property_tier, input.listing.max_roommates);
  if (!isValidTargetOccupancy(propertyTier, input.targetOccupancy)) {
    throw new Error(`Invalid occupancy ${input.targetOccupancy} for a ${propertyTier}-slot property.`);
  }

  const userId = await currentUserId();
  const existing = await findUserCreditForProperty(userId, input.listing.id);
  if (existing && existing.status !== 'expired') {
    throw new Error('You already have a spot reserved on this property.');
  }

  const { estateId, estate } = await resolveEstateForListing(input.listing);
  if (input.joinCode && input.joinCode.trim()) {
    return joinPodByCode({ code: input.joinCode, listing: input.listing, estate, estateId, propertyTier });
  }
  return createFounderCredit({ listing: input.listing, estate, estateId, propertyTier, targetOccupancy: input.targetOccupancy, createCode: input.createCode });
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
  if (userId === 'usr-current-student') {
    return getLocalCredits();
  }
  try {
    const { data, error } = await supabase.from('slot_credits').select('*, estate:estates(*)').eq('user_id', userId);
    if (error || !data) {
      return [];
    }
    return data as SlotCredit[];
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch user slot credits:', error);
    return [];
  }
}

export async function fetchActivePods(estateId?: string): Promise<Pod[]> {
  const userId = await currentUserId();
  const filterLocal = (pods: Pod[]) => pods.filter((pod) => !estateId || pod.estate_id === estateId);
  if (userId === 'usr-current-student') {
    return filterLocal(getLocalPods());
  }
  try {
    let query = supabase
      .from('pods')
      .select('*, members:pod_members!inner(*)')
      .eq('members.user_id', userId);
    if (estateId) {
      query = query.eq('estate_id', estateId);
    }
    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    const pods = data as Pod[];
    const allUserIds = [...new Set(pods.flatMap((pod) => pod.members.map((m) => m.user_id)))];
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', allUserIds);
      if (profiles) {
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        for (const pod of pods) {
          for (const member of pod.members) {
            const profile = profileMap.get(member.user_id);
            if (profile) {
              (member as PodMember & { profile?: { id: string; full_name?: string | null; avatar_url?: string | null } }).profile = profile as { id: string; full_name?: string | null; avatar_url?: string | null };
            }
          }
        }
      }
    }
    for (const pod of pods) {
      const invitations = await fetchPodInvitations(pod.id);
      const inviteMembers: PodMember[] = invitations.map((inv) => ({
        user_id: `inv-${inv.id}`,
        full_name: inv.invitee_name,
        intent_size: 1,
        campus: '',
        major: '',
        cleanliness_score: 0,
        sleep_schedule: '',
        slot_credit_id: 'invitation',
      }));
      pod.members = [...pod.members, ...inviteMembers];
    }

    return pods;
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch pods:', error);
    return filterLocal(getLocalPods());
  }
}

export async function fetchPodInvitations(podId: string): Promise<PodInvitation[]> {
  const userId = await currentUserId();
  if (userId === 'usr-current-student') return [];
  try {
    const { data, error } = await supabase
      .from('pod_invitations')
      .select('*')
      .eq('pod_id', podId)
      .eq('status', 'pending');
    if (error || !data) return [];
    return data as PodInvitation[];
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch pod invitations:', error);
    return [];
  }
}

export async function inviteRoommateToPod(podId: string | undefined, inviteeName: string, inviteeUserId?: string): Promise<Pod | null> {
  const userId = await currentUserId();

  if (userId === 'usr-current-student') {
    const targetPod = getLocalPods().find((p) => !podId || p.id === podId) ?? getLocalPods()[0];
    if (!targetPod) return null;
    const target = targetPod.target_occupancy ?? targetPod.property_tier;
    const newMember: PodMember = {
      user_id: `usr-inv-${Date.now()}`,
      full_name: inviteeName,
      intent_size: 1,
      campus: 'UNILAG (Main Campus)',
      major: 'Separate Billing (Pending)',
      cleanliness_score: 5,
      sleep_schedule: 'Flexible',
      slot_credit_id: 'pending-separate-billing',
    };
    const nextTotalIntent = targetPod.current_total_intent + 1;
    if (nextTotalIntent > target) {
      throw new Error('This pod is already at full occupancy. No more invites allowed.');
    }
    const isNowFinalized = verifyPodCompleteness(nextTotalIntent, target);
    const updatedPod: Pod = {
      ...targetPod,
      members: [...targetPod.members, newMember],
      current_total_intent: nextTotalIntent,
      is_finalized: isNowFinalized,
      physical_room_id: isNowFinalized ? targetPod.physical_room_id ?? `room-${Math.floor(700 + Math.random() * 100)}` : targetPod.physical_room_id,
    };
    upsertPod(updatedPod);
    return updatedPod;
  }

  if (!podId) throw new Error('No pod found to invite to.');
  const { error } = await supabase.from('pod_invitations').insert({
    pod_id: podId,
    inviter_user_id: userId,
    invitee_user_id: inviteeUserId ?? null,
    invitee_name: inviteeName,
  });
  if (error) throw new Error(error.message);
  return null;
}
