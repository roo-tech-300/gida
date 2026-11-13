import { useState } from 'react';
import { router, type Href } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { useCreateListingForm } from '@/context/create-listing-context';
import { useCreateListing } from '@/hooks/use-create-listing';
import { supabase } from '@/lib/supabase';
import {
  insertListingPhotos,
  updateListing,
  updateListingPrimaryImage,
  uploadListingImage,
  type CreateListingInput,
} from '@/services/listing-service';
import { getErrorMessage } from '@/utils/error-message';
import { buildListingInput, validateListingForm } from '@/utils/listing-input';

const LISTING_IMAGES_BUCKET = 'listing-images';

function isRemoteUrl(value: string): boolean {
  return value.startsWith('https://') || value.startsWith('http://');
}

function toPhotoRows(listingId: string, urls: string[]) {
  return urls.map((url, index) => ({ listing_id: listingId, image_url: url, display_order: index + 1 }));
}

/** Drops the wizard slides so back never returns into the wizard, then navigates. */
function leaveWizardTo(path: Href): void {
  if (router.canDismiss()) router.dismissAll();
  router.replace(path);
}

/** Publishes (create) or saves (edit) the listing built by the creation wizard. */
export function useSaveListing() {
  const { data, reset, editListingId } = useCreateListingForm();
  const { step2, step5 } = data;
  const { mutateAsync: createMutate } = useCreateListing();
  const { showToast } = useAppToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);

  const buildInput = (): CreateListingInput =>
    buildListingInput(data, { adminId: profile?.id ?? '', city: profile?.city || 'Minna' });

  const createListing = async () => {
    const { id } = await createMutate(buildInput());

    if (step5.heroImage) {
      const primaryUrl = await uploadListingImage(id, step5.heroImage, 'hero.jpg');
      await updateListingPrimaryImage(id, primaryUrl);
    }

    const galleryLocal = step5.galleryImages.filter((uri) => !isRemoteUrl(uri));
    if (galleryLocal.length > 0) {
      const urls = await Promise.all(galleryLocal.map((uri, i) => uploadListingImage(id, uri, `gallery/${i}.jpg`)));
      await insertListingPhotos(toPhotoRows(id, urls));
      // Gallery-only listings have no hero, so the first photo becomes the cover.
      if (!step5.heroImage) await updateListingPrimaryImage(id, urls[0]);
    }

    showToast({ message: 'Listing published successfully!', type: 'success' });
    reset();
    leaveWizardTo('/admin/total-inventory');
  };

  const updateExistingListing = async (id: string) => {
    const payload: Partial<CreateListingInput> = { ...buildInput() };
    delete payload.category;
    if (!step2.transferAdminId) delete payload.admin_id;
    await updateListing(id, payload);

    const { data: existingRows } = await supabase.from('listing_photos').select('image_url').eq('listing_id', id);
    const existingUrls = (existingRows || []).map((row) => row.image_url).filter(Boolean);

    if (step5.heroImage) {
      const heroUrl = isRemoteUrl(step5.heroImage)
        ? step5.heroImage
        : await uploadListingImage(id, step5.heroImage, 'hero.jpg');
      await updateListingPrimaryImage(id, heroUrl);
    }

    const keptUrls = step5.galleryImages.filter(isRemoteUrl);
    const newLocalUris = step5.galleryImages.filter((uri) => !isRemoteUrl(uri));
    const uploadedUrls = await Promise.all(
      newLocalUris.map((uri, i) => uploadListingImage(id, uri, `gallery/edit-${Date.now()}-${i}.jpg`)),
    );
    const finalUrls = [...keptUrls, ...uploadedUrls];
    if (!step5.heroImage) await updateListingPrimaryImage(id, finalUrls[0] ?? null);

    for (const url of existingUrls.filter((existing) => !finalUrls.includes(existing))) {
      const path = url.split(`/${LISTING_IMAGES_BUCKET}/`)[1];
      if (!path) continue;
      await supabase.storage
        .from(LISTING_IMAGES_BUCKET)
        .remove([path])
        .catch((error: unknown) => console.error('[Listing] Failed to remove storage file:', path, error));
    }

    if (existingUrls.length > 0 || finalUrls.length > 0) {
      await supabase.from('listing_photos').delete().eq('listing_id', id);
    }
    if (finalUrls.length > 0) await insertListingPhotos(toPhotoRows(id, finalUrls));

    queryClient.invalidateQueries({ queryKey: ['listing', id] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    showToast({ message: 'Listing updated successfully!', type: 'success' });
    reset();
    leaveWizardTo(`/admin/listing/${id}`);
  };

  const publish = async () => {
    const problem = validateListingForm(data);
    if (problem) {
      showToast({ message: problem, type: 'error' });
      return;
    }

    setIsPublishing(true);
    try {
      if (editListingId !== null) await updateExistingListing(editListingId);
      else await createListing();
    } catch (error: unknown) {
      console.error('[CreateListing] Failed to save listing:', error);
      showToast({ message: getErrorMessage(error, 'Failed to save listing.'), type: 'error' });
    } finally {
      setIsPublishing(false);
    }
  };

  return { publish, isPublishing };
}
