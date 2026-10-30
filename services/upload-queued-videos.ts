import type { QueryClient } from '@tanstack/react-query';
import { listingVideosQueryKey } from '@/hooks/use-listing-videos';
import { runListingVideoUpload } from '@/services/run-listing-video-upload';
import { clearUpload, setUpload } from '@/utils/listing-video-upload-store';
import type { PickedVideo } from '@/utils/pick-listing-video';

function queueLabel(video: PickedVideo, index: number, total: number): string {
  return total > 1 ? `${video.fileName} (${index + 1} of ${total})` : video.fileName;
}

/**
 * Uploads the videos picked while creating a listing, one at a time (the
 * upload store holds one upload per listing). Runs in the background after
 * Publish; the listing's admin screen shows progress. A failed video doesn't
 * stop the rest; canceling stops the queue.
 */
export async function uploadQueuedVideos(
  listingId: string,
  videos: PickedVideo[],
  queryClient: QueryClient,
): Promise<void> {
  const failures: { video: PickedVideo; message: string }[] = [];

  for (const [index, video] of videos.entries()) {
    const outcome = await runListingVideoUpload(listingId, video, queueLabel(video, index, videos.length));
    await queryClient.invalidateQueries({ queryKey: listingVideosQueryKey(listingId) });
    if (outcome.kind === 'canceled') return;
    if (outcome.kind === 'failed') failures.push({ video, message: outcome.message });
  }

  if (failures.length === 0) {
    clearUpload(listingId);
    return;
  }
  const [first] = failures;
  setUpload(listingId, {
    status: 'failed',
    fileName: failures.length === 1 ? first.video.fileName : `${failures.length} videos`,
    error:
      failures.length === 1
        ? first.message
        : `${failures.length} of ${videos.length} videos didn't upload. Add them again here. (${first.message})`,
  });
}
