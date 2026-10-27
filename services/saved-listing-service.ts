import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';
import { type Place } from '@/types/place';

// ---------------------------------------------------------------------------
// Lodge (listing) saves
// ---------------------------------------------------------------------------

export async function getLodgeSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', userId)
    .eq('type', 'lodge');

  if (error) throw error;
  return (data ?? []).map((r) => r.listing_id as string);
}

export async function saveListing(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .insert({ user_id: userId, listing_id: listingId, type: 'lodge' });

  if (error) throw error;
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .eq('type', 'lodge');

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Place saves
// ---------------------------------------------------------------------------

export async function getPlaceSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_listings')
    .select('place_id')
    .eq('user_id', userId)
    .eq('type', 'place');

  if (error) throw error;
  return (data ?? []).map((r) => r.place_id as string);
}

export async function savePlace(userId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .insert({ user_id: userId, place_id: placeId, type: 'place' });

  if (error) throw error;
}

export async function unsavePlace(userId: string, placeId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId)
    .eq('type', 'place');

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Paginated unified saved feed
// ---------------------------------------------------------------------------

export type SavedLodgeItem = { type: 'lodge'; listing: ReturnType<typeof mapDbToFeedListing> };
export type SavedPlaceItem = { type: 'place'; place: Place };
export type SavedItem = SavedLodgeItem | SavedPlaceItem;

function mapPlaceRow(row: Record<string, any>): Place {
  const sortedPhotos = [...(row.place_photos ?? [])].sort(
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as Place['category'],
    area: row.area as string,
    city: 'Minna',
    address: row.address ?? '',
    description: row.description as string,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    priceRange: 1,
    rating: row.rating ?? 0,
    ratingCount: row.rating_count ?? 0,
    tags: [],
    hours: '',
    openStatus: 'unknown' as const,
    verified: row.verified ?? false,
    featured: row.featured ?? false,
    images: sortedPhotos.map((p: any) => p.url).join(','),
  };
}

export async function getSavedItems(
  userId: string,
  filter: 'all' | 'lodge' | 'place',
  { from, to }: { from: number; to: number },
): Promise<SavedItem[]> {
  let q = supabase
    .from('saved_listings')
    .select(`
      type,
      listing_id,
      place_id,
      listings ( * ),
      places (
        id, name, category, area, address, description,
        latitude, longitude, rating, rating_count,
        verified, featured,
        place_photos ( url, sort_order )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter !== 'all') {
    q = q.eq('type', filter);
  }

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row: any): SavedItem => {
    if (row.type === 'place' && row.places) {
      return { type: 'place', place: mapPlaceRow(row.places) };
    }
    return { type: 'lodge', listing: mapDbToFeedListing(row.listings as DbListing) };
  });
}

// Keep old name for backwards compat with existing hooks
export const getSavedIds = getLodgeSavedIds;
export async function getSavedListings(userId: string) {
  return getSavedItems(userId, 'lodge', { from: 0, to: 49 }).then((items) =>
    items
      .filter((i): i is SavedLodgeItem => i.type === 'lodge')
      .map((i) => i.listing),
  );
}
