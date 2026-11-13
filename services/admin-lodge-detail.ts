import type { AdminLodgeMember } from '@/services/admin-lodge-verification-service';
import { supabase } from '@/lib/supabase';
import { fetchProfilesInChunks } from '@/utils/profile-chunking';

export type AdminLodgeDetail = {
  pod: {
    id: string;
    verificationStatus: string;
    targetOccupancy: number;
    memberCount: number;
    createdAt: string;
    rejectionReason: string | null;
  };
  members: AdminLodgeMember[];
  listing: { id: string; title: string; primaryImage: string | null; location: string; priceAmount: number } | null;
};

export async function fetchAdminLodgeDetail(podId: string): Promise<AdminLodgeDetail | null> {
  try {
    const { data: pod, error: podError } = await supabase
      .from('pods')
      .select('id, listing_id, target_occupancy, verification_status, rejection_reason, created_at, members:pod_members(user_id, slot_credit_id, amount_paid)')
      .eq('id', podId)
      .maybeSingle();

    if (podError || !pod) return null;

    const memberRows = (pod.members as { user_id: string; slot_credit_id: string; amount_paid: number | null }[]) ?? [];
    const memberUserIds = memberRows.map((m) => m.user_id).filter(Boolean);

    const [namesMap, listing] = await Promise.all([
      memberUserIds.length > 0
        ? fetchProfilesInChunks(memberUserIds).then((profiles) => {
            const names = new Map<string, string | null>();
            for (const [id, profile] of Object.entries(profiles)) {
              names.set(id, profile.full_name ?? null);
            }
            return names;
          })
        : Promise.resolve(new Map<string, string | null>()),
      pod.listing_id
        ? supabase.from('listings').select('id, title, primary_image, location_landmark, price_amount').eq('id', pod.listing_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const listingRow = listing.data as { id: string; title: string; primary_image: string | null; location_landmark: string; price_amount: number } | null;

    const members: AdminLodgeMember[] = memberRows.map((m) => ({
      userId: m.user_id,
      userName: namesMap.get(m.user_id) ?? null,
      slotCreditId: m.slot_credit_id,
      amountPaid: m.amount_paid,
    }));

    return {
      pod: {
        id: pod.id,
        verificationStatus: pod.verification_status,
        targetOccupancy: pod.target_occupancy,
        memberCount: members.length,
        createdAt: pod.created_at,
        rejectionReason: pod.rejection_reason ?? null,
      },
      members,
      listing: listingRow
        ? { id: listingRow.id, title: listingRow.title, primaryImage: listingRow.primary_image, location: listingRow.location_landmark, priceAmount: listingRow.price_amount }
        : null,
    };
  } catch (error) {
    console.error('[AdminLodgeService] Failed to fetch detail:', error);
    return null;
  }
}
