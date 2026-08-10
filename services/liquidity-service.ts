import { supabase } from '@/lib/supabase';
import type { Estate, SlotCredit, Pod } from '@/types/liquidity';
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

export async function purchaseSlotCredit(estateId: string, propertyTier: number, intentSize: number, targetOccupancy: number): Promise<SlotCredit> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'usr-current-student';

    const existingEstate = MOCK_ESTATES.find((e) => e.id === estateId || e.property_tier === propertyTier);
    const fallbackEstate: Estate = existingEstate ?? {
      id: estateId,
      name: `Gida Residence (Tier ${propertyTier})`,
      description: `Tier ${propertyTier} premium student accommodation unit with biometric security.`,
      campus: 'University of Lagos, Akoka',
      property_tier: propertyTier,
      price_per_annum: 300000 * propertyTier,
      physical_rooms_inventory: 10,
      abstract_slots_available: 10 * propertyTier,
      primary_image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      rules: ['Quiet hours after 10 PM', 'No indoor smoking', 'Student ID required'],
      amenities: ['Generator', 'Fenced Gate', 'Internet', 'Wardrobe', 'Borehole Water'],
    };

    const newCredit: SlotCredit = {
      id: `credit-dyn-${Date.now()}`,
      user_id: userId,
      estate_id: estateId,
      property_tier: propertyTier,
      intent_size: intentSize,
      target_occupancy: targetOccupancy,
      status: 'booked_pending_claim',
      invite_code: `GIDA-POD-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
      payment_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      estate: fallbackEstate,
    };

    const newPod: Pod = {
      id: `pod-dyn-${Math.floor(100 + Math.random() * 900)}`,
      estate_id: estateId,
      property_tier: propertyTier,
      matched_gender: 'ANY',
      target_occupancy: targetOccupancy,
      members: [
        {
          user_id: userId,
          full_name: 'You (Current User)',
          intent_size: intentSize,
          campus: 'UNILAG (Main Campus)',
          major: 'Computer Science',
          cleanliness_score: 5,
          sleep_schedule: 'Midnight (12 AM)',
          slot_credit_id: newCredit.id,
        },
      ],
      current_total_intent: intentSize,
      is_finalized: intentSize === propertyTier,
      physical_room_id: intentSize === propertyTier ? 'room-701' : null,
      created_at: new Date().toISOString(),
    };

    localUserCredits = [newCredit, ...localUserCredits];
    localPods = [newPod, ...localPods];

    const { data, error } = await supabase
      .from('slot_credits')
      .insert({
        user_id: userId,
        estate_id: estateId,
        property_tier: propertyTier,
        intent_size: intentSize,
        target_occupancy: targetOccupancy,
        status: 'booked_pending_claim',
        payment_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      })
      .select()
      .maybeSingle();

    if (error || !data) {
      console.warn('[LiquidityService] Supabase insert failed or offline, returning synchronized local credit.');
      return newCredit;
    }
    return data as SlotCredit;
  } catch (error) {
    console.error('[LiquidityService] Exception during purchaseSlotCredit:', error);
    return localUserCredits[0];
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

