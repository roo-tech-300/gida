import { useQuery } from '@tanstack/react-query';
import { fetchListingVideos } from '@/services/listing-video-service';

export const listingVideosQueryKey = (listingId: string) => ['listing-videos', listingId] as const;

/** Ready videos never change, so they cache for 30 minutes and aren't refetched on remount. */
export function useListingVideos(listingId: string) {
  return useQuery({
    queryKey: listingVideosQueryKey(listingId),
    queryFn: () => fetchListingVideos(listingId),
    enabled: !!listingId,
    staleTime: 30 * 60 * 1000,
  });
}
