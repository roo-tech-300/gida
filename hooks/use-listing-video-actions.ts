import { useCallback } from 'react';
import { useAppToast } from '@/components/ui/toast-card';
import type { useCustomAlert } from '@/components/ui/custom-alert';
import { useDeleteListingVideo } from '@/hooks/use-listing-videos';
import { useListingVideoUpload } from '@/hooks/use-listing-video-upload';
import type { ListingVideo } from '@/types/listing-video';
import { pickListingVideo } from '@/utils/pick-listing-video';

type AlertControls = ReturnType<typeof useCustomAlert>;

/** Pick → validate → upload, and confirm → delete, with user-facing feedback. */
export function useListingVideoActions(listingId: string, alert: AlertControls) {
  const { showToast } = useAppToast();
  const uploadControls = useListingVideoUpload(listingId);
  const deleteMutation = useDeleteListingVideo(listingId);
  const { start } = uploadControls;
  const { showAlert } = alert;

  const addVideo = useCallback(async () => {
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
        await start(result.video);
      }
    } catch (error) {
      console.error('[ListingVideoManager] Failed to pick or upload a video:', error);
      showToast({ message: 'Could not open that video. Please try another one.', type: 'error' });
    }
  }, [showAlert, showToast, start]);

  const confirmDelete = useCallback(
    (video: ListingVideo) => {
      showAlert({
        title: 'Delete this video?',
        message: 'Students will no longer see it on this listing. This cannot be undone.',
        buttons: [
          { label: 'Cancel', style: 'cancel' },
          {
            label: 'Delete',
            style: 'destructive',
            onPress: () =>
              deleteMutation.mutate(video.id, {
                onSuccess: () => showToast({ message: 'Video deleted.', type: 'success' }),
                onError: (error) => {
                  console.error('[ListingVideoManager] Failed to delete video:', error);
                  showToast({ message: error.message || 'Could not delete the video.', type: 'error' });
                },
              }),
          },
        ],
      });
    },
    [deleteMutation, showAlert, showToast],
  );

  return {
    ...uploadControls,
    addVideo,
    confirmDelete,
    deletingId: deleteMutation.isPending ? deleteMutation.variables : null,
  };
}
