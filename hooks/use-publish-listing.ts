import { useState } from 'react';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { useCreateListingForm, type CreateListingData } from '@/context/create-listing-context';
import { createListingWithPhotos, updateListingWithPhotos } from '@/services/save-listing';
import { uploadQueuedVideos } from '@/services/upload-queued-videos';

function missingField({ step1, step4, step5 }: CreateListingData): string | null {
  if (!step1.title.trim()) return 'Title is required. Go back to step 1.';
  if (!step1.layoutType) return 'Please select a layout type in step 1.';
  if (!step1.price) return 'Please enter a price in step 1.';
  if (step4.maxRoommates < 1 || step4.maxRoommates > 4) return 'Max roommates must be between 1 and 4 in step 4.';
  if (!step5.heroImage && step5.galleryImages.length === 0) return 'Please add at least one photo.';
  return null;
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

  const create = async () => {
    const id = await createListingWithPhotos(data, profile);
    queryClient.invalidateQueries({ queryKey: ['listings'] });

    const videos = data.step5.pendingVideos;
    if (videos.length > 0) {
      // Background: the listing's admin screen shows progress and failures.
      uploadQueuedVideos(id, videos, queryClient).catch((error: unknown) =>
        console.error('[CreateListing] Video upload queue stopped unexpectedly:', error),
      );
    }
    const videoNote = videos.length > 0 ? ' Videos are uploading; keep the app open.' : '';
    showToast({ message: `Listing published successfully!${videoNote}`, type: 'success' });
    reset();
    leaveWizard('/admin/total-inventory');
  };

  const update = async (id: string) => {
    await updateListingWithPhotos(id, data, profile);
    queryClient.invalidateQueries({ queryKey: ['listing', id] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    showToast({ message: 'Listing updated successfully!', type: 'success' });
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
