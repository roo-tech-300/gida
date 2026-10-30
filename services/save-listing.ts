import type { AuthProfile } from '@/context/auth-context';
import type { CreateListingData } from '@/context/create-listing-context';
import { supabase } from '@/lib/supabase';
import {
  createListing,
  insertListingPhotos,
  updateListing,
  updateListingPrimaryImage,
  uploadListingImage,
  type CreateListingInput,
} from '@/services/listing-service';
import { buildListingInput } from '@/utils/build-listing-input';

function isRemoteUrl(str: string) {
  return str.startsWith('https://') || str.startsWith('http://');
}

/** Creates the listing row, then uploads its hero and gallery photos. Returns the new id. */
export async function createListingWithPhotos(data: CreateListingData, profile: AuthProfile | null): Promise<string> {
  const { step5 } = data;
  const { id } = await createListing(buildListingInput(data, profile));

  if (step5.heroImage) {
    const primaryUrl = await uploadListingImage(id, step5.heroImage, 'hero.jpg');
    await updateListingPrimaryImage(id, primaryUrl);
  }

  if (step5.galleryImages.length > 0) {
    const galleryLocal = step5.galleryImages.filter((u) => !isRemoteUrl(u));
    const galleryUrls = await Promise.all(
      galleryLocal.map((uri, i) => uploadListingImage(id, uri, `gallery/${i}.jpg`)),
    );
    await insertListingPhotos(
      galleryUrls.map((url, i) => ({ listing_id: id, image_url: url, display_order: i + 1 })),
    );
  }

  return id;
}

/** Saves the edited fields and reconciles photos: uploads new ones, removes dropped ones. */
export async function updateListingWithPhotos(
  id: string,
  data: CreateListingData,
  profile: AuthProfile | null,
): Promise<void> {
  const { step2, step5 } = data;
  const updatePayload: Partial<CreateListingInput> = { ...buildListingInput(data, profile) };
  delete updatePayload.category;
  if (!step2.transferAdminId) {
    delete updatePayload.admin_id;
  }
  await updateListing(id, updatePayload);

  const { data: existingRows } = await supabase.from('listing_photos').select('image_url').eq('listing_id', id);
  const existingUrls = (existingRows || []).map((r) => r.image_url).filter(Boolean);

  if (step5.heroImage) {
    const newHeroUrl = isRemoteUrl(step5.heroImage)
      ? step5.heroImage
      : await uploadListingImage(id, step5.heroImage, 'hero.jpg');
    await updateListingPrimaryImage(id, newHeroUrl);
  } else {
    await updateListingPrimaryImage(id, null);
  }

  const finalUrls = step5.galleryImages.filter(isRemoteUrl);
  const newLocalUris = step5.galleryImages.filter((item) => !isRemoteUrl(item));
  const uploadedNew = await Promise.all(
    newLocalUris.map((uri, i) => uploadListingImage(id, uri, `gallery/edit-${Date.now()}-${i}.jpg`)),
  );
  finalUrls.push(...uploadedNew);

  const removedUrls = existingUrls.filter((url) => !finalUrls.includes(url));
  for (const url of removedUrls) {
    const path = url.split('/listing-images/')[1];
    if (path) {
      await supabase.storage
        .from('listing-images')
        .remove([path])
        .catch((error: unknown) => console.error('[SaveListing] Failed to remove a dropped photo:', path, error));
    }
  }

  if (existingUrls.length > 0 || finalUrls.length > 0) {
    await supabase.from('listing_photos').delete().eq('listing_id', id);
  }

  if (finalUrls.length > 0) {
    await insertListingPhotos(
      finalUrls.map((url, i) => ({ listing_id: id, image_url: url, display_order: i + 1 })),
    );
  }
}
