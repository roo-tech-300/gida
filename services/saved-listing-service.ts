import { supabase } from '@/lib/supabase';
import { mapDbToFeedListing, type DbListing } from '@/types/feed-listing';

export async function getSavedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((r) => r.listing_id);
}

export async function saveListing(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .insert({ user_id: userId, listing_id: listingId });

  if (error) throw error;
}

export async function unsaveListing(userId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_listings')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) throw error;
}

export async function getSavedListings(userId: string): Promise<ReturnType<typeof mapDbToFeedListing>[]> {
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((r: any) => mapDbToFeedListing(r.listings as DbListing));
}
