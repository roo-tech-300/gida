import { useCallback } from 'react';
import { useAppToast } from '@/components/ui/toast-card';
import type { useCustomAlert } from '@/components/ui/custom-alert';
import { pickListingVideo, type PickedVideo } from '@/utils/pick-listing-video';

type AlertControls = ReturnType<typeof useCustomAlert>;

/** Opens the picker and explains any problem; resolves to the video, or null. */
export function usePickListingVideo(alert: AlertControls): () => Promise<PickedVideo | null> {
  const { showToast } = useAppToast();
  const { showAlert } = alert;

  return useCallback(async () => {
    try {
      const result = await pickListingVideo();
      if (result.kind === 'denied') {
        showAlert({
          title: 'Permission required',
          message: 'Please allow photo library access to pick a video.',
          buttons: [{ label: 'OK', style: 'primary' }],
        });
      } else if (result.kind === 'invalid') {
        showToast({ message: result.message, type: 'error' });
      } else if (result.kind === 'picked') {
        return result.video;
      }
    } catch (error) {
      console.error('[ListingVideoPicker] Failed to pick a video:', error);
      showToast({ message: 'Could not open that video. Please try another one.', type: 'error' });
    }
    return null;
  }, [showAlert, showToast]);
}
