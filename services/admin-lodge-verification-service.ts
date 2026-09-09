import { supabase } from '@/lib/supabase';
import { chunkInIds, fetchProfilesInChunks } from '@/utils/profile-chunking';

export type AdminLodgeView = 'pending' | 'rejected';

export type AdminLodgeReservation = {
  creditId: string;
  userId: string;
  userName: string | null;
  listingId: string;
  listingTitle: string;
  listingImage: string | null;
  listingLocation: string;
  amountPaid: number | null;
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

    const { data, error } = await supabase
      .from('slot_credits')
      .select('id, user_id, listing_id, amount_paid, status, created_at, rejection_reason')
      .eq('status', statusValue)
      .in('listing_id', listingIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      console.warn('[AdminLodgeService] Fetch skipped:', error?.message ?? 'no data');
      return [];
    }

    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))];
    const lidIds = [...new Set(data.map((r) => r.listing_id).filter(Boolean))];

    const [namesRes, listingsRes] = await Promise.all([
      userIds.length > 0
        ? (async () => {
            const profiles = await fetchProfilesInChunks(userIds);
            const names = new Map<string, string | null>();
            for (const [id, profile] of Object.entries(profiles)) {
              names.set(id, profile.full_name ?? null);
            }
            return { data: Array.from(names.entries()), error: null };
          })()
        : { data: null, error: null },
      lidIds.length > 0
        ? (async () => {
            const chunks = chunkInIds(lidIds);
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

    return data.map((row) => {
      const listing = listings.get(row.listing_id);
      return {
        creditId: row.id,
        userId: row.user_id,
        userName: names.get(row.user_id) ?? null,
        listingId: row.listing_id,
        listingTitle: listing?.title ?? 'Unknown property',
        listingImage: listing?.primary_image ?? null,
        listingLocation: listing?.location_landmark ?? '',
        amountPaid: row.amount_paid,
        status: row.status,
        createdAt: row.created_at,
        rejectionReason: row.rejection_reason ?? null,
      };
    });
  } catch (error) {
    console.error('[AdminLodgeService] Failed to fetch reservations:', error);
    return [];
  }
}

export type AdminLodgeDetail = {
  credit: {
    id: string;
    status: string;
    amountPaid: number | null;
    targetOccupancy: number;
    createdAt: string;
    rejectionReason: string | null;
  };
  user: { id: string; name: string | null; email: string | null };
  listing: { id: string; title: string; primaryImage: string | null; location: string; priceAmount: number } | null;
};

export async function fetchAdminLodgeDetail(creditId: string): Promise<AdminLodgeDetail | null> {
  try {
    const { data, error } = await supabase
      .from('slot_credits')
      .select('id, user_id, listing_id, amount_paid, status, target_occupancy, created_at, rejection_reason')
      .eq('id', creditId)
      .maybeSingle();

    if (error || !data) return null;

    const [profileRes, listingRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name').eq('id', data.user_id).maybeSingle(),
      data.listing_id
        ? supabase.from('listings').select('id, title, primary_image, location_landmark, price_amount').eq('id', data.listing_id).maybeSingle()
        : { data: null, error: null },
    ]);

    const profile = profileRes.data as { id: string; full_name: string | null } | null;
    const listing = listingRes.data as { id: string; title: string; primary_image: string | null; location_landmark: string; price_amount: number } | null;

    let email: string | null = null;
    if (data.user_id) {
      const { data: authData } = await supabase.auth.admin.getUserById(data.user_id);
      email = authData?.user?.email ?? null;
    }

    return {
      credit: {
        id: data.id,
        status: data.status,
        amountPaid: data.amount_paid,
        targetOccupancy: data.target_occupancy,
        createdAt: data.created_at,
        rejectionReason: data.rejection_reason ?? null,
      },
      user: { id: data.user_id, name: profile?.full_name ?? null, email },
      listing: listing
        ? { id: listing.id, title: listing.title, primaryImage: listing.primary_image, location: listing.location_landmark, priceAmount: listing.price_amount }
        : null,
    };
  } catch (error) {
    console.error('[AdminLodgeService] Failed to fetch detail:', error);
    return null;
  }
}

export async function acceptReservation(creditId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('slot_credits')
      .update({
        status: 'booked_pending_claim',
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', creditId)
      .eq('status', 'pending_verification');

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

export async function rejectReservation(creditId: string, reason: string): Promise<boolean> {
  if (!reason.trim()) return false;
  try {
    const { error } = await supabase
      .from('slot_credits')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        verified_at: new Date().toISOString(),
      })
      .eq('id', creditId)
      .eq('status', 'pending_verification');

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
