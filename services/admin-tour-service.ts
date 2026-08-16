import { supabase } from '@/lib/supabase';
import type { AdminTour, AdminTourDetail, TourBookingStatus, TourListingBrief } from '@/types/tour-booking';

type BookingRow = {
  id: string;
  user_id: string;
  listing_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: TourBookingStatus;
  created_at: string;
};

async function fetchProfileNames(ids: string[]): Promise<Map<string, string | null>> {
  const names = new Map<string, string | null>();
  if (ids.length === 0) {
    return names;
  }
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', ids);
  for (const profile of (data as { id: string; full_name: string | null }[] | null) ?? []) {
    names.set(profile.id, profile.full_name);
  }
  return names;
}

async function fetchListings(ids: string[]): Promise<Map<string, TourListingBrief>> {
  const listings = new Map<string, TourListingBrief>();
  if (ids.length === 0) {
    return listings;
  }
  const { data } = await supabase
    .from('listings')
    .select('id, title, location_landmark, city, primary_image, price_amount')
    .in('id', ids);
  for (const row of (data as (TourListingBrief & { id: string })[] | null) ?? []) {
    listings.set(row.id, row);
  }
  return listings;
}

export async function fetchAdminTours(): Promise<AdminTour[]> {
  try {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('id, user_id, listing_id, scheduled_date, scheduled_time, status, created_at')
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: false })
      .limit(100);
    if (error || !data) {
      console.warn('[AdminTourService] Tour fetch skipped:', error?.message ?? 'no data');
      return [];
    }

    const rows = data as BookingRow[];
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    const listingIds = [...new Set(rows.map((row) => row.listing_id))];
    const [names, listings] = await Promise.all([fetchProfileNames(userIds), fetchListings(listingIds)]);

    return rows.map((row) => ({
      id: row.id,
      listing_id: row.listing_id,
      student_name: names.get(row.user_id) ?? null,
      scheduled_date: row.scheduled_date,
      scheduled_time: row.scheduled_time,
      status: row.status,
      created_at: row.created_at,
      listings: listings.get(row.listing_id) ?? null,
    }));
  } catch (error) {
    console.error('[AdminTourService] Failed to fetch admin tours:', error);
    return [];
  }
}

export async function fetchAdminTourDetail(bookingId: string): Promise<AdminTourDetail | null> {
  try {
    const { data, error } = await supabase
      .from('tour_bookings')
      .select('id, user_id, listing_id, scheduled_date, scheduled_time, status, created_at')
      .eq('id', bookingId)
      .maybeSingle();
    if (error || !data) {
      console.warn('[AdminTourService] Detail fetch skipped:', error?.message ?? 'not found');
      return null;
    }

    const row = data as BookingRow;
    const [names, listings] = await Promise.all([
      fetchProfileNames([row.user_id]),
      fetchListings([row.listing_id]),
    ]);

    return {
      booking: {
        id: row.id,
        scheduled_date: row.scheduled_date,
        scheduled_time: row.scheduled_time,
        status: row.status,
        created_at: row.created_at,
      },
      student: { id: row.user_id, name: names.get(row.user_id) ?? null },
      listing: listings.get(row.listing_id) ?? null,
    };
  } catch (error) {
    console.error('[AdminTourService] Failed to fetch tour detail:', error);
    return null;
  }
}
