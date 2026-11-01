import { useCallback, useSyncExternalStore } from 'react';
import { getUpload, subscribeToListingUpload } from '@/utils/listing-video-upload-store';

export function useListingUploadProgress(listingId: string) {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToListingUpload(listingId, listener),
    [listingId],
  );
  const getSnapshot = useCallback(() => getUpload(listingId), [listingId]);
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => null,
  );
}
