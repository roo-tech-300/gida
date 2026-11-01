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
import { photoUris } from '@/types/wizard-media';

function isRemoteUrl(str: string) {
  return str.startsWith('https://') || str.startsWith('http://');
}

/**
 * Every photo in display order. The cover photo comes first, so the listing's
 * primary image and the gallery's first item are the same picture.
 */
function orderedPhotos(step5: CreateListingData['step5']): string[] {
  const heroPhoto = step5.hero?.kind === 'photo' ? [step5.hero.uri] : [];
  return [...new Set([...heroPhoto, ...photoUris(step5.gallery)])];
}

/** Creates the listing row, then uploads its photos. Returns the new id. */
export async function createListingWithPhotos(data: CreateListingData, profile: AuthProfile | null): Promise<string> {
  const { id } = await createListing(buildListingInput(data, profile));

  const photos = orderedPhotos(data.step5);
  const [cover, ...rest] = photos;
  const urls: string[] = [];
  // The cover first (it is the most visible), then the rest in parallel.
  if (cover) urls.push(await uploadListingImage(id, cover, 'hero.jpg'));
  urls.push(
    ...(await Promise.all(rest.map((uri, index) => uploadListingImage(id, uri, `gallery/${index + 1}.jpg`)))),
  );

  // A video cover has no photo yet; the first gallery photo still gives feed
  // cards a poster until the video's own poster is generated.
  await updateListingPrimaryImage(id, urls[0] ?? null);

  if (urls.length > 0) {
    await insertListingPhotos(
      urls.map((url, index) => ({ listing_id: id, image_url: url, display_order: index + 1 })),
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

  // Listings created before the media refactor kept the cover only in
  // `primary_image`; their gallery already starts with a copy of it. Adding the
  // cover to `listing_photos` would show the same picture twice, so leave their
  // gallery untouched until they pick a new cover.
  const heroUri = step5.hero?.kind === 'photo' ? step5.hero.uri : null;
  const legacyCoverOnly =
    heroUri !== null &&
    isRemoteUrl(heroUri) &&
    existingUrls.length > 0 &&
    !existingUrls.includes(heroUri);
  const allPhotos = orderedPhotos(step5);
  const photos = legacyCoverOnly ? allPhotos.filter((uri) => uri !== heroUri) : allPhotos;

  const finalUrls = await Promise.all(
    photos.map((uri, index) => {
      if (isRemoteUrl(uri)) return uri;
      const suffix = index === 0 ? `hero-edit-${Date.now()}.jpg` : `gallery/edit-${Date.now()}-${index}.jpg`;
      return uploadListingImage(id, uri, suffix);
    }),
  );

  await updateListingPrimaryImage(id, legacyCoverOnly ? heroUri : finalUrls[0] ?? null);

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
      finalUrls.map((url, index) => ({ listing_id: id, image_url: url, display_order: index + 1 })),
    );
  }
}
