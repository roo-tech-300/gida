import { UploadCanceledError, uploadListingVideo } from '@/services/listing-video-upload';
import { registerAbort, setUpload, setUploadProgress } from '@/utils/listing-video-upload-store';
import type { PickedVideo } from '@/utils/pick-listing-video';

export type ListingVideoUploadOutcome =
  | { kind: 'done' }
  | { kind: 'canceled' }
  | { kind: 'failed'; message: string };

/**
 * Uploads one video and mirrors its progress into the shared upload store, so
 * any screen showing this listing sees it. The caller decides what the store
 * shows once it settles. `label` is the name shown on the progress card.
 */
export async function runListingVideoUpload(
  listingId: string,
  video: PickedVideo,
  label: string = video.fileName,
): Promise<ListingVideoUploadOutcome> {
  setUpload(listingId, { status: 'uploading', fileName: label, progress: 0 });
  const handle = uploadListingVideo(listingId, video, (fraction) =>
    setUploadProgress(listingId, label, fraction),
  );
  registerAbort(listingId, handle.abort);

  try {
    await handle.done;
    return { kind: 'done' };
  } catch (error) {
    if (error instanceof UploadCanceledError) return { kind: 'canceled' };
    console.error('[ListingVideoUpload] Upload failed:', error);
    return { kind: 'failed', message: error instanceof Error ? error.message : 'Upload failed. Please try again.' };
  }
}
