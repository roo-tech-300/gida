import { supabase } from '@/lib/supabase';
import type { Review, CreateReviewPayload } from '@/types/reviews';

export async function fetchReviewsForListing(listingId: string): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
        id,
        listing_id,
        user_id,
        rating,
        text,
        created_at,
        updated_at
      `
      )
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchReviewsForListing] Failed to fetch reviews:', error.message);
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error('[fetchReviewsForListing] Exception:', err);
    return [];
  }
}

export async function createReview(payload: CreateReviewPayload & { user_id: string }): Promise<Review | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          listing_id: payload.listing_id,
          user_id: payload.user_id,
          rating: payload.rating,
          text: payload.text,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[createReview] Failed to create review:', error.message);
      throw new Error(error.message);
    }

    return data ?? null;
  } catch (err) {
    console.error('[createReview] Exception:', err);
    throw err;
  }
}

export async function updateReview(reviewId: string, payload: Partial<CreateReviewPayload>): Promise<Review | null> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        ...(payload.rating && { rating: payload.rating }),
        ...(payload.text && { text: payload.text }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('[updateReview] Failed to update review:', error.message);
      throw new Error(error.message);
    }

    return data ?? null;
  } catch (err) {
    console.error('[updateReview] Exception:', err);
    throw err;
  }
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

    if (error) {
      console.error('[deleteReview] Failed to delete review:', error.message);
      throw new Error(error.message);
    }

    return true;
  } catch (err) {
    console.error('[deleteReview] Exception:', err);
    throw err;
  }
}
