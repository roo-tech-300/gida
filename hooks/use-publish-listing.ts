import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { useCreateListingForm, type CreateListingData } from '@/context/create-listing-context';
import { createListingWithPhotos, updateListingWithPhotos } from '@/services/save-listing';
import { setListingHeroVideo } from '@/services/listing-video-service';
import { uploadQueuedVideos } from '@/services/upload-queued-videos';
import { isNewVideoMedia } from '@/types/wizard-media';
import type { PickedVideo } from '@/utils/pick-listing-video';

function missingField({ step1, step4, step5 }: CreateListingData): string | null {
  if (!step1.title.trim()) return 'Title is required. Go back to step 1.';
  if (!step1.layoutType) return 'Please select a layout type in step 1.';
  if (!step1.price) return 'Please enter a price in step 1.';
  if (step4.maxRoommates < 1 || step4.maxRoommates > 4) return 'Max roommates must be between 1 and 4 in step 4.';
  if (!step5.hero) return 'Please pick a cover photo or video.';
  return null;
}

/** New videos in upload order, with the cover first when it is a new video. */
function collectVideos(step5: CreateListingData['step5']): { videos: PickedVideo[]; heroIndex: number | null } {
  const heroVideo = step5.hero?.kind === 'video' ? step5.hero.video : null;
  const galleryVideos = step5.gallery.filter(isNewVideoMedia).map((item) => item.video);
  return {
    videos: heroVideo ? [heroVideo, ...galleryVideos] : galleryVideos,
    heroIndex: heroVideo ? 0 : null,
  };
}

/**
 * Leaves the wizard: dismiss its slides first, because `replace` alone only
 * swaps the top route (step 5) and back would return into steps 1-4.
 */
function leaveWizard(href: '/admin/total-inventory' | `/admin/listing/${string}`) {
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace(href);
}

/** Validates the wizard, creates or updates the listing, then leaves the wizard. */
export function usePublishListing() {
  const { data, reset, editListingId } = useCreateListingForm();
  const { profile } = useAuth();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  const [isPublishing, setIsPublishing] = useState(false);

  const queueVideos = (id: string) => {
    const { videos, heroIndex } = collectVideos(data.step5);
    if (videos.length === 0) return '';
    // Background: the admin can leave the wizard while videos upload.
    uploadQueuedVideos(id, videos, queryClient, { heroIndex })
      .then((summary) => {
        if (summary.failed === 0) return;
        const plural = summary.failed === 1 ? '' : 's';
        showToast({
          message: `${summary.failed} video${plural} didn't upload. Open the listing and add ${summary.failed === 1 ? 'it' : 'them'} again from Edit.`,
          type: 'error',
        });
      })
      .catch((error: unknown) =>
        console.error('[CreateListing] Video upload queue stopped unexpectedly:', error),
      );
    return ' Videos are uploading; keep the app open.';
  };

  const create = async () => {
    const id = await createListingWithPhotos(data, profile);
    queryClient.invalidateQueries({ queryKey: ['listings'] });

    const videoNote = queueVideos(id);
    showToast({ message: `Listing published successfully!${videoNote}`, type: 'success' });
    reset();
    leaveWizard('/admin/total-inventory');
  };

  const update = async (id: string) => {
    await updateListingWithPhotos(id, data, profile);

    // An existing video chosen as the cover only needs its order changed.
    const hero = data.step5.hero;
    if (hero?.kind === 'uploaded-video') {
      await setListingHeroVideo(id, hero.video.id).catch((error: unknown) =>
        console.error('[CreateListing] Failed to make the chosen video the cover:', error),
      );
    }

    queryClient.invalidateQueries({ queryKey: ['listing', id] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    const videoNote = queueVideos(id);
    showToast({ message: `Listing updated successfully!${videoNote}`, type: 'success' });
    reset();
    leaveWizard(`/admin/listing/${id}`);
  };

  const publish = async () => {
    const problem = missingField(data);
    if (problem) {
      showToast({ message: problem, type: 'error' });
      return;
    }

    setIsPublishing(true);
    try {
      if (editListingId !== null) {
        await update(editListingId);
      } else {
        await create();
      }
    } catch (error) {
      console.error('[CreateListing] Failed to save listing:', error);
      const msg = error instanceof Error ? error.message : String(error);
      showToast({ message: msg || 'Failed to save listing.', type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  return { publish, isPublishing, isEditing: editListingId !== null };
}
