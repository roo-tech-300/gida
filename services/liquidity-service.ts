import { supabase } from '@/lib/supabase';
import type { Estate, SlotCredit, Pod, ReserveSlotCreditInput, ReserveSlotCreditResult } from '@/types/liquidity';
import { MOCK_ESTATES, MOCK_SLOT_CREDITS, MOCK_PODS } from '@/dummy/liquidity-mock';

let localUserCredits: SlotCredit[] = [...MOCK_SLOT_CREDITS];
let localPods: Pod[] = [...MOCK_PODS];

export function resetLocalLiquidityState() {
  localUserCredits = [...MOCK_SLOT_CREDITS];
  localPods = [...MOCK_PODS];
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

export async function reserveSlotCredit(input: ReserveSlotCreditInput): Promise<ReserveSlotCreditResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Please sign in to reserve a slot.');
    }

    const { data, error } = await supabase.rpc('reserve_slot_credit', {
      p_user_id: user.id,
      p_listing_id: input.listingId,
      p_pod_id: input.podId ?? null,
      p_intent_size: input.intentSize,
      p_amount: input.amount ?? 0,
    });

    if (error) {
      throw error;
    }

    const result = data as ReserveSlotCreditResult;
    if (!result.success) {
      throw new Error(result.error || 'Slot reservation failed.');
    }
    return result;
  } catch (error) {
    console.error('[LiquidityService] reserveSlotCredit failed:', error);
    throw error;
  }
}

export async function findPodByGroupCode(groupCode: string): Promise<Pod | null> {
  try {
    const code = groupCode.trim().toUpperCase();
    if (!code) return null;
    const { data, error } = await supabase
      .from('pods')
      .select('id, tier, status, current_total_intent, listing_id, group_code')
      .eq('group_code', code)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return data as Pod;
  } catch (error) {
    console.error('[LiquidityService] findPodByGroupCode failed:', error);
    return null;
  }
}

export async function fetchUserSlotCredits(): Promise<SlotCredit[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || localUserCredits !== MOCK_SLOT_CREDITS) {
      return localUserCredits;
    }
    const { data, error } = await supabase
      .from('slot_credits')
      .select('*, estate:estates(*)')
      .eq('user_id', user.id);

    if (error || !data || data.length === 0) {
      return localUserCredits;
    }
    return data as SlotCredit[];
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch user slot credits:', error);
    return localUserCredits;
  }
}

export async function fetchActivePods(estateId?: string): Promise<Pod[]> {
  try {
    if (localPods !== MOCK_PODS) {
      return localPods.filter((p) => !estateId || p.estate_id === estateId);
    }
    let query = supabase.from('pods').select('*, members:pod_members(*)');
    if (estateId) {
      query = query.eq('estate_id', estateId);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return localPods;
    }
    return data as Pod[];
  } catch (error) {
    console.error('[LiquidityService] Failed to fetch pods:', error);
    return localPods;
  }
}

export async function inviteRoommateToPod(podId: string | undefined, studentIdOrEmail: string): Promise<Pod | null> {
  try {
    const targetPod = localPods.find((p) => !podId || p.id === podId) ?? localPods[0];
    if (!targetPod) return null;

    const newMember = {
      user_id: `usr-inv-${Date.now()}`,
      full_name: `Invited: ${studentIdOrEmail}`,
      intent_size: 1,
      campus: 'UNILAG (Main Campus)',
      major: 'Separate Billing (Pending)',
      cleanliness_score: 5,
      sleep_schedule: 'Flexible',
      slot_credit_id: 'pending-separate-billing',
    };

    const nextTotalIntent = targetPod.current_total_intent + 1;
    const isNowFinalized = nextTotalIntent >= targetPod.property_tier;

    const updatedPod: Pod = {
      ...targetPod,
      members: [...targetPod.members, newMember],
      current_total_intent: nextTotalIntent,
      is_finalized: isNowFinalized,
      physical_room_id: isNowFinalized ? 'room-701' : targetPod.physical_room_id,
    };

    localPods = localPods.map((p) => (p.id === targetPod.id ? updatedPod : p));
    return updatedPod;
  } catch (error) {
    console.error('[LiquidityService] Exception during inviteRoommateToPod:', error);
    throw error;
  }
}

