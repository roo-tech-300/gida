import { supabase } from '@/lib/supabase';
import { chunkInIds, fetchProfilesInChunks } from '@/utils/profile-chunking';

export type AdminLodgeView = 'pending' | 'rejected';

export type AdminLodgeMember = {
  userId: string;
  userName: string | null;
  slotCreditId: string;
  amountPaid: number | null;
};

export type AdminLodgeReservation = {
  podId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  listingLocation: string;
  memberCount: number;
  targetOccupancy: number;
  members: AdminLodgeMember[];
  status: string;
  createdAt: string;
  rejectionReason: string | null;
};

async function fetchAdminListingIds(adminId: string): Promise<string[]> {
  const { data: adminRow, error: adminError } = await supabase
    .from('admin_profiles')
    .select('role, assigned_region_id')
    .eq('id', adminId)
    .maybeSingle();

  if (adminError || !adminRow) return [];

  let query = supabase.from('listings').select('id');

  if (adminRow.role === 'super_admin') {
    // no filter
  } else if (adminRow.role === 'regional_admin' && adminRow.assigned_region_id) {
    query = query.or(`admin_id.eq.${adminId},region_path.cs.{${adminRow.assigned_region_id}}`);
  } else {
    query = query.eq('admin_id', adminId);
  }

  const { data } = await query;
  return ((data as { id: string }[]) ?? []).map((r) => r.id);
}

export async function fetchAdminLodgeReservations(
  adminId: string,
  view: AdminLodgeView = 'pending',
): Promise<AdminLodgeReservation[]> {
  try {
    const listingIds = await fetchAdminListingIds(adminId);
    if (listingIds.length === 0) return [];

    const statusValue = view === 'pending' ? 'pending_verification' : 'rejected';

    const { data: pods, error: podsError } = await supabase
      .from('pods')
      .select('id, listing_id, target_occupancy, verification_status, rejection_reason, created_at, members:pod_members(user_id, slot_credit_id, amount_paid)')
      .eq('verification_status', statusValue)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (podsError || !pods) {
      console.warn('[AdminLodgeService] Fetch skipped:', podsError?.message ?? 'no data');
      return [];
    }

    const allUserIds = new Set<string>();
    const lidIds = new Set<string>();
    for (const pod of pods) {
      if (pod.listing_id) lidIds.add(pod.listing_id);
      for (const m of (pod.members as { user_id: string }[]) ?? []) {
        if (m.user_id) allUserIds.add(m.user_id);
      }
    }

    const [namesRes, listingsRes] = await Promise.all([
      allUserIds.size > 0
        ? (async () => {
            const profiles = await fetchProfilesInChunks([...allUserIds]);
            const names = new Map<string, string | null>();
            for (const [id, profile] of Object.entries(profiles)) {
              names.set(id, profile.full_name ?? null);
            }
            return { data: Array.from(names.entries()), error: null };
          })()
        : { data: null, error: null },
      lidIds.size > 0
        ? (async () => {
            const chunks = chunkInIds([...lidIds]);
            const listingsMap: Map<string, { title: string; primary_image: string | null; location_landmark: string }> = new Map();
            for (const chunk of chunks) {
              const { data } = await supabase
                .from('listings')
                .select('id, title, primary_image, location_landmark')
                .in('id', chunk);
              for (const row of (data as { id: string; title: string; primary_image: string | null; location_landmark: string }[] | null) ?? []) {
                listingsMap.set(row.id, row);
              }
            }
            return { data: Array.from(listingsMap.values()), error: null };
          })()
        : { data: null, error: null },
    ]);

    const names = new Map<string, string | null>();
    for (const p of ((namesRes.data as [string, string | null][]) ?? [])) {
      names.set(p[0], p[1]);
    }
    const listings = new Map<string, { title: string; primary_image: string | null; location_landmark: string }>();
    for (const l of ((listingsRes.data as { id: string; title: string; primary_image: string | null; location_landmark: string }[]) ?? [])) {
      listings.set(l.id, l);
    }

    return pods.map((pod) => {
      const listing = listings.get(pod.listing_id);
      const members = ((pod.members as { user_id: string; slot_credit_id: string; amount_paid: number | null }[]) ?? []).map((m) => ({
        userId: m.user_id,
        userName: names.get(m.user_id) ?? null,
        slotCreditId: m.slot_credit_id,
        amountPaid: m.amount_paid,
      }));

      return {
        podId: pod.id,
        listingId: pod.listing_id,
        listingTitle: listing?.title ?? 'Unknown property',
        listingImage: listing?.primary_image ?? null,
        listingLocation: listing?.location_landmark ?? '',
        memberCount: members.length,
        targetOccupancy: pod.target_occupancy,
        members,
        status: pod.verification_status,
        createdAt: pod.created_at,
        rejectionReason: pod.rejection_reason ?? null,
      };
    });
  } catch (error) {
    console.error('[AdminLodgeService] Failed to fetch reservations:', error);
    return [];
  }
}

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

export async function acceptReservation(podId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pods')
      .update({
        verification_status: 'approved',
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', podId)
      .eq('verification_status', 'pending_verification');

    if (error) {
      console.error('[AdminLodgeService] Accept failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[AdminLodgeService] Accept exception:', error);
    return false;
  }
}

export async function rejectReservation(podId: string, reason: string): Promise<boolean> {
  if (!reason.trim()) return false;
  try {
    const { error } = await supabase
      .from('pods')
      .update({
        verification_status: 'rejected',
        rejection_reason: reason.trim(),
        verified_at: new Date().toISOString(),
      })
      .eq('id', podId)
      .eq('verification_status', 'pending_verification');

    if (error) {
      console.error('[AdminLodgeService] Reject failed:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[AdminLodgeService] Reject exception:', error);
    return false;
  }
}
