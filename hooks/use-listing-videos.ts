import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LISTING_VIDEO_POLL_MS } from '@/constants/listing-video';
import { deleteListingVideo, fetchListingVideos } from '@/services/listing-video-service';
import type { ListingVideo } from '@/types/listing-video';

export const listingVideosQueryKey = (listingId: string) => ['listing-videos', listingId] as const;

function isPending(video: ListingVideo): boolean {
  return video.status === 'queued' || video.status === 'processing';
}

/**
 * Videos for a listing. Ready videos never change, so this caches for a while;
 * it only polls while something is still transcoding (admin screens).
 */
export function useListingVideos(listingId: string) {
  return useQuery({
    queryKey: listingVideosQueryKey(listingId),
    queryFn: () => fetchListingVideos(listingId),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: (query) => (query.state.data?.some(isPending) ? LISTING_VIDEO_POLL_MS : false),
  });
}

export function useDeleteListingVideo(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (videoId: string) => deleteListingVideo(videoId),
    onSuccess: (_result, videoId) => {
      queryClient.setQueryData<ListingVideo[]>(listingVideosQueryKey(listingId), (videos) =>
        videos?.filter((video) => video.id !== videoId),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listingVideosQueryKey(listingId) }),
  });
}
