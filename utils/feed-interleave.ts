import type { FeedListing } from '@/types/feed-listing';
import type { RecommendedPod } from '@/types/pod-recommendation';
import { MAX_SHELF_PODS } from '@/utils/pod-grid';

/** Insert the first pod shelf after this many listings. */
export const FEED_SHELF_FIRST_AT = 4;

/** Then repeat after this many listings. */
export const FEED_SHELF_EVERY = 8;

export type FeedItem =
  | { kind: 'listing'; key: string; listing: FeedListing }
  | { kind: 'pods'; key: string; pods: RecommendedPod[] };

export type FeedInterleaveOptions = {
  firstAt?: number;
  every?: number;
  maxPodsPerShelf?: number;
};

/**
 * Take the next unshown pods for one shelf. Pods already displayed in an
 * earlier shelf of the same feed are skipped, so a small marketplace never
 * repeats the same groups. Returns null when nothing new is left.
 */
function nextShelf(
  rankedPods: readonly RecommendedPod[],
  shownPodIds: Set<string>,
  maxPods: number,
): FeedItem | null {
  const shelfPods: RecommendedPod[] = [];

  for (const pod of rankedPods) {
    if (shownPodIds.has(pod.id)) continue;
    shelfPods.push(pod);
    if (shelfPods.length === maxPods) break;
  }

  if (shelfPods.length === 0) return null;

  shelfPods.forEach((pod) => shownPodIds.add(pod.id));

  return {
    kind: 'pods',
    key: `pods:${shelfPods.map((pod) => pod.id).join(',')}`,
    pods: shelfPods,
  };
}

/**
 * Merge the listing reel with pod shelves.
 *
 * With the defaults and 20 listings + 8 pods the result is:
 * 4 listings → shelf(6) → 8 listings → shelf(2) → 8 listings.
 *
 * A shelf is only ever a whole-number multiple of screen heights by virtue of
 * being rendered inside the same fixed-height FlatList row, so no layout math
 * downstream has to change.
 */
export function buildFeedItems(
  listings: readonly FeedListing[],
  pods: readonly RecommendedPod[],
  options: FeedInterleaveOptions = {},
): FeedItem[] {
  const firstAt = Math.max(1, Math.trunc(options.firstAt ?? FEED_SHELF_FIRST_AT));
  const every = Math.max(1, Math.trunc(options.every ?? FEED_SHELF_EVERY));
  const maxPods = Math.max(1, Math.trunc(options.maxPodsPerShelf ?? MAX_SHELF_PODS));

  const items: FeedItem[] = [];
  const shownPodIds = new Set<string>();

  let threshold = firstAt;
  let sinceShelf = 0;
  let exhausted = pods.length === 0;

  for (const listing of listings) {
    items.push({ kind: 'listing', key: `listing:${listing.id}`, listing });
    sinceShelf += 1;

    if (exhausted || sinceShelf < threshold) continue;

    const shelf = nextShelf(pods, shownPodIds, maxPods);
    if (!shelf) {
      exhausted = true;
      continue;
    }

    items.push(shelf);
    sinceShelf = 0;
    threshold = every;
  }

  // Short feed (fewer than `firstAt` listings): still surface the shelf once
  // rather than never showing it to a user with a thin recommendation set.
  if (!exhausted && listings.length > 0 && sinceShelf > 0 && listings.length < firstAt) {
    const shelf = nextShelf(pods, shownPodIds, maxPods);
    if (shelf) items.push(shelf);
  }

  return items;
}
