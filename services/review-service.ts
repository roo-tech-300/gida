import { supabase } from '@/lib/supabase';
import type { CreateReviewPayload, Review, ReviewSummary } from '@/types/reviews';

const PAID_STATUSES = ['paid_unmatched', 'matched', 'subletting'] as const;
const MAX_REVIEWS_PER_USER = 3;

type SlotCreditRow = {
  id: string;
  user_id: string;
  listing_id: string | null;
  status: (typeof PAID_STATUSES)[number] | string;
};

function isPaidStatus(status: string): boolean {
  return PAID_STATUSES.includes(status as (typeof PAID_STATUSES)[number]);
}

function normalizeReview(row: Record<string, unknown>): Review {
  return {
    id: String(row.id),
    listing_id: String(row.listing_id),
    user_id: String(row.user_id),
    rating: Number(row.rating),
    text: String(row.text ?? ''),
    anonymous: Boolean(row.anonymous),
    review_number: Number(row.review_number ?? 1),
    slot_id: row.slot_id ? String(row.slot_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    author: row.author ? String(row.author) : undefined,
    avatar: row.avatar ? String(row.avatar) : undefined,
  };
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchReviewsForListing(listingId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(
      `
        id,
        listing_id,
        user_id,
        rating,
        text,
        anonymous,
        review_number,
        slot_id,
        created_at,
        updated_at
      `,
    )
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchReviewsForListing] Failed to fetch reviews:', error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => normalizeReview(row as Record<string, unknown>));
}

export async function fetchReviewSummary(listingId: string): Promise<ReviewSummary> {
  const reviews = await fetchReviewsForListing(listingId);
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as const satisfies Record<1 | 2 | 3 | 4 | 5, number>;

  reviews.forEach((review) => {
    ratingCounts[review.rating as 1 | 2 | 3 | 4 | 5] += 1;
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
  return { averageRating, totalReviews, ratingCounts };
}

export async function fetchReviewEligibility(listingId: string): Promise<{ canReview: boolean; remainingReviews: number; paid: boolean; reviewCount: number }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { canReview: false, remainingReviews: MAX_REVIEWS_PER_USER, paid: false, reviewCount: 0 };
  }

  const [{ data: credits, error: creditError }, { data: reviews, error: reviewError }] = await Promise.all([
    supabase.from('slot_credits').select('id,user_id,listing_id,status').eq('user_id', userId).eq('listing_id', listingId),
    supabase.from('reviews').select('id').eq('user_id', userId).eq('listing_id', listingId),
  ]);

  if (creditError) {
    console.error('[fetchReviewEligibility] Failed to fetch slot credits:', creditError);
  }
  if (reviewError) {
    console.error('[fetchReviewEligibility] Failed to fetch reviews:', reviewError);
  }

  const paidCredit = ((credits ?? []) as SlotCreditRow[]).find((credit) => credit.listing_id === listingId && isPaidStatus(credit.status));
  const reviewCount = (reviews ?? []).length;
  const remainingReviews = Math.max(0, MAX_REVIEWS_PER_USER - reviewCount);

  return {
    canReview: !!paidCredit && remainingReviews > 0,
    remainingReviews,
    paid: !!paidCredit,
    reviewCount,
  };
}

export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('You must be signed in to review this property.');
  }

  const { data: credits, error: creditError } = await supabase
    .from('slot_credits')
    .select('id,user_id,listing_id,status')
    .eq('user_id', userId)
    .eq('listing_id', payload.listing_id);

  if (creditError) {
    console.error('[createReview] Failed to validate slot credit:', creditError);
    throw new Error('Unable to validate your paid slot.');
  }

  const paidCredit = ((credits ?? []) as SlotCreditRow[]).find((credit) => isPaidStatus(credit.status));
  if (!paidCredit) {
    throw new Error('Only users with a paid slot on this property can review it.');
  }

  const { data: existingReviews, error: reviewCountError } = await supabase
    .from('reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', payload.listing_id);

  if (reviewCountError) {
    console.error('[createReview] Failed to count reviews:', reviewCountError);
    throw new Error('Unable to verify your review limit.');
  }

  const reviewCount = existingReviews?.length ?? 0;
  if (reviewCount >= MAX_REVIEWS_PER_USER) {
    throw new Error('You have reached the maximum of 3 reviews for this property.');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      listing_id: payload.listing_id,
      user_id: userId,
      rating: payload.rating,
      text: payload.text,
      anonymous: payload.anonymous,
      review_number: reviewCount + 1,
      slot_id: paidCredit.id,
    })
    .select(
      `
        id,
        listing_id,
        user_id,
        rating,
        text,
        anonymous,
        review_number,
        slot_id,
        created_at,
        updated_at
      `,
    )
    .single();

  if (error) {
    console.error('[createReview] Failed to create review:', error);
    throw new Error(error.message);
  }

  return normalizeReview(data as Record<string, unknown>);
}

export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}
