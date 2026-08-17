export type Review = {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  text: string;
  anonymous: boolean;
  review_number: number;
  slot_id: string | null;
  created_at: string;
  updated_at: string;
  author?: string;
  avatar?: string;
};

export type CreateReviewPayload = {
  listing_id: string;
  rating: number;
  text: string;
  anonymous: boolean;
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
};
