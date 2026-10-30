import { useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { runListingVideoUpload } from '@/services/run-listing-video-upload';
import {
  abortUpload,
  clearUpload,
  getUpload,
  setUpload,
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
      const outcome = await runListingVideoUpload(listingId, video);
      if (outcome.kind === 'done') clearUpload(listingId);
      if (outcome.kind === 'failed') {
        setUpload(listingId, { status: 'failed', fileName: video.fileName, error: outcome.message });
      }
      // The server inserts the row when the upload completes; show it as processing.
      await queryClient.invalidateQueries({ queryKey: listingVideosQueryKey(listingId) });
    },
    [listingId, queryClient],
  );

  const cancel = useCallback(() => abortUpload(listingId), [listingId]);
  const dismiss = useCallback(() => clearUpload(listingId), [listingId]);

  return { upload, start, cancel, dismiss };
}
