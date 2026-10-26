import { supabase } from '@/lib/supabase';
import type { NewPlaceReview, PlaceReview } from '@/types/place';

type PageParams = { from: number; to: number };
type RatingProfile = { username: string | null; full_name: string | null };
type PlaceRatingRow = {
  id: string;
  rating: number;
  created_at: string;
  text: string | null;
  profiles: RatingProfile | null;
};

function formatAuthor(profile: RatingProfile | null): { author: string; initials: string } {
  const author = profile?.username?.trim() || profile?.full_name?.trim() || 'User';
  const initials = author
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return { author, initials };
}

function formatRelativeDate(value: string): string {
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 1) return 'Just now';
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.floor(elapsedHours / 24)}d ago`;
}

function mapPlaceRating(placeId: string, row: PlaceRatingRow): PlaceReview {
  const { author, initials } = formatAuthor(row.profiles);
  return {
    id: row.id,
    placeId,
    author,
    initials,
    rating: row.rating,
    text: row.text?.trim() ?? '',
    createdAt: formatRelativeDate(row.created_at),
  };
}

export async function fetchPlaceRatings(
  placeId: string,
  { from, to }: PageParams,
): Promise<PlaceReview[]> {
  const { data, error } = await supabase
    .from('place_ratings')
    .select('id, rating, created_at, text, profiles(username, full_name)')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('[place-ratings-service] fetchPlaceRatings failed:', error.message);
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as PlaceRatingRow[]).map((row) => mapPlaceRating(placeId, row));
}

export async function upsertPlaceRating(
  placeId: string,
  userId: string,
  review: NewPlaceReview,
): Promise<void> {
  const text = review.text.trim();
  if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
    throw new Error('Rating must be a whole number from 1 to 5.');
  }
  if (text.length === 0 || text.length > 280) {
    throw new Error('Review text must contain between 1 and 280 characters.');
  }

  const { error } = await supabase.from('place_ratings').upsert(
    { place_id: placeId, user_id: userId, rating: review.rating, text },
    { onConflict: 'place_id,user_id' },
  );

  if (error) {
    console.error('[place-ratings-service] upsertPlaceRating failed:', error.message);
    throw new Error(error.message);
  }
}
