import { supabase } from '@/lib/supabase';
import { podOpenSlotStatus } from '@/utils/liquidity-math';
import { currentUserId } from '@/services/liquidity-pod-service';
import type { Pod, PodMember, PodInvitation, SlotCreditStatus } from '@/types/liquidity';

type CreditPaymentStatus = {
  pod_id: string;
  user_id: string;
  slot_credit_id: string;
  status: string;
};

export async function fetchActivePods(estateId?: string, listingId?: string): Promise<Pod[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  try {
    const { data: memberships } = await supabase
      .from('pod_members')
      .select('pod_id')
      .eq('user_id', userId);

    const podIds = [...new Set((memberships ?? []).map((m) => m.pod_id))];
    if (podIds.length === 0) return [];

    let query = supabase
      .from('pods')
      .select('*, members:pod_members(*)')
      .in('id', podIds)
      .order('created_at', { ascending: false });
    if (estateId) {
      query = query.eq('estate_id', estateId);
    }
    if (listingId) {
      query = query.eq('listing_id', listingId);
    }
    const { data, error } = await query;
    if (error || !data) {
      return [];
    }

    const pods = await enrichPods(data as Pod[]);
    return pods;
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch pods:', error);
    return [];
  }
}

export async function fetchOpenPodsForListing(listingId: string): Promise<Pod[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from('pods')
      .select('*, members:pod_members(*)')
      .eq('listing_id', listingId)
      .eq('is_finalized', false);
    if (error || !data) {
      return [];
    }

    const pods = await enrichPods(data as Pod[]);
    return pods.filter(
      (pod) =>
        podOpenSlotStatus(pod).open &&
        !pod.members.some((m) => m.user_id === userId && m.slot_credit_id !== 'invitation'),
    );
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch open pods:', error);
    return [];
  }
}

export async function enrichPods(pods: Pod[]): Promise<Pod[]> {
  const realUserIds = [...new Set(pods.flatMap((pod) => pod.members.map((m) => m.user_id)).filter((id) => !id.startsWith('inv-')))];
  if (realUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, gender')
      .in('id', realUserIds);
    if (profiles) {
      const profileMap = new Map(profiles.map((p) => [p.id, p]));
      for (const pod of pods) {
        for (const member of pod.members) {
          const profile = profileMap.get(member.user_id);
          if (profile) {
            (member as PodMember & { profile?: { id: string; full_name?: string | null; avatar_url?: string | null; gender?: 'MALE' | 'FEMALE' | null } }).profile = profile as { id: string; full_name?: string | null; avatar_url?: string | null; gender?: 'MALE' | 'FEMALE' | null };
            if (!member.full_name) member.full_name = profile.full_name ?? '';
            if (!member.avatar_url) member.avatar_url = profile.avatar_url ?? undefined;
          }
        }
      }
    }
  }
  const realCreditIds = [...new Set(pods.flatMap((pod) => pod.members.map((m) => m.slot_credit_id)).filter((id) => id !== 'invitation'))];
  if (pods.length > 0 && realCreditIds.length > 0) {
    // Only expose payment statuses for pods the caller actually belongs to; the
    // SECURITY DEFINER RPC bypasses slot_credits SELECT RLS while staying gated
    // on pod_members membership. Direct .from('slot_credits') here would return
    // only the caller's own rows and leave co-members' credit_status unset.
    const podIds = pods.map((p) => p.id);
    const creditStatuses = (await supabase.rpc('get_pod_member_payment_statuses', {
      p_pod_ids: podIds,
    }))?.data as CreditPaymentStatus[] | null;
    if (creditStatuses) {
      const statusBySlotCreditId = new Map(creditStatuses.map((c) => [c.slot_credit_id, c.status as SlotCreditStatus]));
      const statusByUserId = new Map(creditStatuses.map((c) => [c.user_id, c.status as SlotCreditStatus]));
      for (const pod of pods) {
        for (const member of pod.members) {
          const status = statusBySlotCreditId.get(member.slot_credit_id) ?? statusByUserId.get(member.user_id);
          if (status) member.credit_status = status;
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
}

export async function fetchPodInvitations(podId: string): Promise<PodInvitation[]> {
  const userId = await currentUserId();
  if (!userId) return [];
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
