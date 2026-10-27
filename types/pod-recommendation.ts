import type { DbListing } from '@/types/feed-listing';
import type { Pod } from '@/types/liquidity';

/**
 * A pod that is still forming, carrying its full listing row (the join flow
 * needs more than the card fields) and its computed match score.
 */
export type RecommendedPod = Pod & {
  listing: DbListing;
  /** Higher is a better match. Produced by `utils/pod-ranking`. */
  score: number;
};

/** Everything we know about the viewer that can influence pod ranking. */
export type PodMatchContext = {
  userId: string;
  gender: 'MALE' | 'FEMALE' | null;
  /** The viewer's school/campus, from their profile. */
  school: string | null;
  minBudget: number | null;
  maxBudget: number | null;
  /** Free-text area preference, matched loosely against landmark and city. */
  preferredArea: string | null;
  /** Listing ids the viewer already holds a slot credit for. */
  bookedListingIds: readonly string[];
  /** Pods already opened during this session. Demoted, never hidden. */
  seenPodIds: readonly string[];
};
