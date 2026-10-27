import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/** Fetch a listing's photo URLs from `listing_photos`, ordered by `display_order`. */
export async function fetchListingPhotos(listingId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('listing_photos')
    .select('image_url')
    .eq('listing_id', listingId)
    .order('display_order', { ascending: true });

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[useListingPhotos] Failed to fetch listing photos:', message);
    throw new Error(message ?? 'Failed to load listing photos.');
  }

  return (data ?? []).map((row) => row.image_url).filter(Boolean);
}

export function useListingPhotos(listingId: string) {
  return useQuery({
    queryKey: ['listing-photos', listingId],
    queryFn: () => fetchListingPhotos(listingId),
    staleTime: 5 * 60 * 1000,
  });
}
