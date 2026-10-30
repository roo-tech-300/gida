import { useCallback } from 'react';
import { useAppToast } from '@/components/ui/toast-card';
import type { useCustomAlert } from '@/components/ui/custom-alert';
import { useDeleteListingVideo } from '@/hooks/use-listing-videos';
import { useListingVideoUpload } from '@/hooks/use-listing-video-upload';
import type { ListingVideo } from '@/types/listing-video';
import { usePickListingVideo } from '@/hooks/use-pick-listing-video';

type AlertControls = ReturnType<typeof useCustomAlert>;

/** Pick → validate → upload, and confirm → delete, with user-facing feedback. */
export function useListingVideoActions(listingId: string, alert: AlertControls) {
  const { showToast } = useAppToast();
  const uploadControls = useListingVideoUpload(listingId);
  const deleteMutation = useDeleteListingVideo(listingId);
  const pickVideo = usePickListingVideo(alert);
  const { start } = uploadControls;
  const { showAlert } = alert;

  const addVideo = useCallback(async () => {
    const video = await pickVideo();
    if (!video) return;
    try {
      await start(video);
    } catch (error) {
      console.error('[ListingVideoManager] Failed to upload a video:', error);
      showToast({ message: 'Could not upload that video. Please try again.', type: 'error' });
    }
  }, [pickVideo, showToast, start]);

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
