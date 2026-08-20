import { supabase } from '@/lib/supabase';

const SEARCH_LIMIT = 20;

export type ListingSearchResult = {
  id: string;
  title: string;
  layout_type: string;
  location_landmark: string;
  city: string;
  price_amount: number;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  primary_image: string | null;
  category: string;
};

export type RoommateSearchResult = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  school: string | null;
  bio: string | null;
  preferred_area: string | null;
};

function sanitizeQuery(q: string): string {
  return q.replace(/[%_]/g, '');
}

export async function searchListings(query: string): Promise<ListingSearchResult[]> {
  const q = sanitizeQuery(query.trim());

  const { data, error } = await supabase
    .from('listings')
    .select('id, title, layout_type, location_landmark, city, price_amount, number_of_bedrooms, number_of_bathrooms, primary_image, category')
    .or(
      `title.ilike.%${q}%,layout_type.ilike.%${q}%,location_landmark.ilike.%${q}%,city.ilike.%${q}%`,
    )
    .limit(SEARCH_LIMIT);

  if (error) {
    console.error('[searchService] Failed to search listings:', error.message);
    throw new Error(error.message);
  }

  return (data ?? []) as ListingSearchResult[];
}

export async function searchRoommates(query: string): Promise<RoommateSearchResult[]> {
  const q = sanitizeQuery(query.trim());

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, school, bio, living_preferences(preferred_area)')
    .or(`full_name.ilike.%${q}%,school.ilike.%${q}%,bio.ilike.%${q}%`)
    .eq('show_in_roommate_feed', true)
    .eq('onboarded', true)
    .limit(SEARCH_LIMIT);

  if (error) {
    console.error('[searchService] Failed to search roommates:', error.message);
    throw new Error(error.message);
  }

  const rows = data ?? [];

  return rows.map((row: any) => ({
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    school: row.school,
    bio: row.bio,
    preferred_area: Array.isArray(row.living_preferences)
      ? row.living_preferences[0]?.preferred_area ?? null
      : row.living_preferences?.preferred_area ?? null,
  })) as RoommateSearchResult[];
}
