import type { QueryClient } from '@tanstack/react-query';
import { listingVideosQueryKey } from '@/hooks/use-listing-videos';
import { setListingHeroVideo } from '@/services/listing-video-service';
import { runListingVideoUpload } from '@/services/run-listing-video-upload';
import { clearUpload, setUpload } from '@/utils/listing-video-upload-store';
import type { PickedVideo } from '@/utils/pick-listing-video';

function queueLabel(video: PickedVideo, index: number, total: number): string {
  return total > 1 ? `${video.fileName} (${index + 1} of ${total})` : video.fileName;
}

export interface QueuedVideoOptions {
  /** Index in `videos` that should become the listing's cover. */
  heroIndex?: number | null;
}

export interface QueuedVideoSummary {
  uploaded: number;
  failed: number;
  canceled: boolean;
}

/**
 * Uploads the videos picked in the wizard, one at a time (the upload store
 * holds one upload per listing). Runs in the background after saving; the
 * caller can surface the summary. A failed video doesn't stop the rest;
 * canceling stops the queue. When `heroIndex` is set, that video is moved to
 * the front afterwards so the feed uses its preview as the cover.
 */
export async function uploadQueuedVideos(
  listingId: string,
  videos: PickedVideo[],
  queryClient: QueryClient,
  options: QueuedVideoOptions = {},
): Promise<QueuedVideoSummary> {
  const failures: { video: PickedVideo; message: string }[] = [];
  let uploaded = 0;

  for (const [index, video] of videos.entries()) {
    const outcome = await runListingVideoUpload(listingId, video, queueLabel(video, index, videos.length));
    await queryClient.invalidateQueries({ queryKey: listingVideosQueryKey(listingId) });
    if (outcome.kind === 'canceled') return { uploaded, failed: failures.length, canceled: true };
    if (outcome.kind === 'failed') {
      failures.push({ video, message: outcome.message });
      continue;
    }
    uploaded += 1;
    if (options.heroIndex === index && outcome.videoId) {
      await setListingHeroVideo(listingId, outcome.videoId).catch((error: unknown) => {
        console.error('[ListingVideoUpload] Failed to make the uploaded video the cover:', error);
      });
    }
  }

  if (failures.length === 0) {
    clearUpload(listingId);
    return { uploaded, failed: 0, canceled: false };
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
  return { uploaded, failed: failures.length, canceled: false };
}
