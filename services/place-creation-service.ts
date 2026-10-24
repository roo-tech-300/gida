import { supabase } from '@/lib/supabase';
import { addPlace } from '@/services/places-service';
import type { Place, PlaceDraft } from '@/types/place';
import { resolveImageArrayBuffer } from '@/utils/image-buffer';
import { buildPlaceFromDraft } from '@/utils/place-factory';

const STORAGE_BUCKET = 'place-photos';

type CreatePlaceParams = {
  draft: PlaceDraft;
  photos: string[];
  userId: string;
};

export async function createPlace({ draft, photos, userId }: CreatePlaceParams): Promise<string> {
  const localPlace: Place = {
    ...buildPlaceFromDraft(draft),
    images: photos.join(','),
  };

  try {
    const { data, error } = await supabase
      .from('places')
      .insert({
        created_by: userId,
        name: draft.name.trim(),
        category: draft.category,
        area: draft.area.trim(),
        address: draft.address.trim() || null,
        description: draft.description.trim(),
        latitude: draft.latitude ?? null,
        longitude: draft.longitude ?? null,
        rating: 0,
        rating_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      console.warn('[PlaceCreationService] Supabase insert failed, using local place:', error.message);
      addPlace(localPlace);
      return localPlace.id;
    }

    const placeId = data.id as string;
    localPlace.id = placeId;

    if (photos.length > 0) {
      await uploadPlacePhotos(placeId, photos);
    }

    addPlace(localPlace);
    return placeId;
  } catch (error) {
    console.error('[PlaceCreationService] Unexpected error while creating place:', error);
    addPlace(localPlace);
    return localPlace.id;
  }
}

async function uploadPlacePhotos(placeId: string, photos: string[]): Promise<void> {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i += 1) {
    const uri = photos[i];
    try {
      const fileName = `${Date.now()}_${i}.jpg`;
      const filePath = `${placeId}/${fileName}`;
      const buffer = await resolveImageArrayBuffer(uri);

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, buffer, { contentType: 'image/jpeg', upsert: true });

      if (!uploadError) {
        const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
        uploadedUrls.push(publicData.publicUrl);
      } else {
        uploadedUrls.push(uri);
      }
    } catch (err) {
      console.warn(`[PlaceCreationService] Photo upload failed for index ${i}:`, err);
      uploadedUrls.push(uri);
    }
  }

  if (uploadedUrls.length > 0) {
    const rows = uploadedUrls.map((url, sortOrder) => ({
      place_id: placeId,
      url,
      sort_order: sortOrder,
    }));
    const { error: photoDbError } = await supabase.from('place_photos').insert(rows);
    if (photoDbError) {
      console.warn('[PlaceCreationService] Could not insert place_photos rows:', photoDbError.message);
    }
  }
}
