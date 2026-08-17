export type Review = {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string;
  author?: string;
  avatar?: string;
};

export type CreateReviewPayload = {
  listing_id: string;
  rating: number;
  text: string;
};
