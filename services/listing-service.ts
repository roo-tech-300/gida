import { supabase } from '@/lib/supabase';

export type CreateListingInput = {
  admin_id: string;
  title: string;
  description: string | null;
  landlord_id: string | null;
  category: string;
  layout_type: 'self_contain' | 'single_room' | 'flat';
  price_amount: number;
  lease_term: 'per_semester' | 'per_annum';
  units_available: number;
  max_roommates: number;
  rules: string[];
  location_landmark: string;
  city: string;
  campus: string | null;
  latitude: number;
  longitude: number;
  is_shared_bathroom: boolean;
  is_shared_kitchen: boolean;
  has_borehole: boolean;
  has_generator: boolean;
  has_fenced_gate: boolean;
  has_internet: boolean;
  has_burglary: boolean;
  has_cabinet: boolean;
  has_wardrobe: boolean;
  custom_features: string[];
  primary_image: string | null;
};

export type CreateListingPhoto = {
  listing_id: string;
  image_url: string;
  display_order: number;
};

export async function createListing(input: CreateListingInput): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('listings')
    .insert({
      admin_id: input.admin_id,
      title: input.title,
      description: input.description,
      landlord_id: input.landlord_id,
      category: input.category,
      layout_type: input.layout_type,
      price_amount: input.price_amount,
      lease_term: input.lease_term,
      units_available: input.units_available,
      max_roommates: input.max_roommates,
      rules: input.rules,
      location_landmark: input.location_landmark,
      city: input.city,
      campus: input.campus,
      latitude: input.latitude,
      longitude: input.longitude,
      is_shared_bathroom: input.is_shared_bathroom,
      is_shared_kitchen: input.is_shared_kitchen,
      has_borehole: input.has_borehole,
      has_generator: input.has_generator,
      has_fenced_gate: input.has_fenced_gate,
      has_internet: input.has_internet,
      has_burglary: input.has_burglary,
      has_cabinet: input.has_cabinet,
      has_wardrobe: input.has_wardrobe,
      custom_features: input.custom_features,
      primary_image: input.primary_image,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data as { id: string };
}

export async function insertListingPhotos(photos: CreateListingPhoto[]): Promise<void> {
  if (photos.length === 0) return;

  const { error } = await supabase.from('listing_photos').insert(photos);

  if (error) throw error;
}
