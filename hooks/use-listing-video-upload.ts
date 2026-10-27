import { useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UploadCanceledError, uploadListingVideo } from '@/services/listing-video-upload';
import {
  abortUpload,
  clearUpload,
  getUpload,
  registerAbort,
  setUpload,
  setUploadProgress,
  subscribeToUploads,
  type ListingVideoUploadState,
} from '@/utils/listing-video-upload-store';
import type { PickedVideo } from '@/utils/pick-listing-video';
import { listingVideosQueryKey } from '@/hooks/use-listing-videos';

export interface ListingVideoUploadControls {
  upload: ListingVideoUploadState | null;
  start: (video: PickedVideo) => Promise<void>;
  cancel: () => void;
  dismiss: () => void;
}

export function useListingVideoUpload(listingId: string): ListingVideoUploadControls {
  const queryClient = useQueryClient();
  const upload = useSyncExternalStore(
    subscribeToUploads,
    () => getUpload(listingId),
    () => getUpload(listingId),
  );

  const start = useCallback(
    async (video: PickedVideo) => {
      setUpload(listingId, { status: 'uploading', fileName: video.fileName, progress: 0 });
      const handle = uploadListingVideo(listingId, video, (fraction) =>
        setUploadProgress(listingId, video.fileName, fraction),
      );
      registerAbort(listingId, handle.abort);

      try {
        await handle.done;
        clearUpload(listingId);
      } catch (error) {
        if (error instanceof UploadCanceledError) return;
        console.error('[ListingVideoUpload] Upload failed:', error);
        const message = error instanceof Error ? error.message : 'Upload failed. Please try again.';
        setUpload(listingId, { status: 'failed', fileName: video.fileName, error: message });
      } finally {
        // The server inserts the row when the upload completes; show it as processing.
        await queryClient.invalidateQueries({ queryKey: listingVideosQueryKey(listingId) });
      }
    },
    [listingId, queryClient],
  );

  const cancel = useCallback(() => abortUpload(listingId), [listingId]);
  const dismiss = useCallback(() => clearUpload(listingId), [listingId]);

  return { upload, start, cancel, dismiss };
}
