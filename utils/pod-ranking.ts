import { MAX_SHELF_PODS } from '@/utils/pod-grid';
import {
  calculateEqualShare,
  isGenderCompatible,
  podEffectiveGender,
  podOpenSlotStatus,
} from '@/utils/liquidity-math';
import type { DbListing } from '@/types/feed-listing';
import type { Pod } from '@/types/liquidity';
import type { PodMatchContext, RecommendedPod } from '@/types/pod-recommendation';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Weights are intentionally generous and readable; they only ever compare each other. */
const WEIGHT = {
  campusMatch: 40,
  budgetInRange: 30,
  budgetBelowRange: 15,
  budgetNearRange: 10,
  budgetOverRange: 25,
  areaMatch: 20,
  recentStrong: 10,
  recentWeak: 5,
  lastSeat: 15,
  twoSeats: 8,
  seenPenalty: 25,
} as const;

type PodWithListing = Pod & { listing: DbListing };

function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Loose text match so "Gidan Kwano" still matches "Gidan Kwano, Minna". */
function relatedText(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

/** What one member of this pod would pay per year. */
export function podPerPersonPrice(pod: PodWithListing): number {
  const occupancy = pod.target_occupancy || pod.listing.property_tier || 1;
  return calculateEqualShare(pod.listing.price_amount, occupancy);
}

/**
 * Hard filters. A pod that fails any of these must never be shown to the
 * viewer: they cannot join it, or joining it would break an existing booking.
 */
export function isPodEligible(pod: PodWithListing, ctx: PodMatchContext): boolean {
  if (!pod.listing?.id) return false;
  if (pod.is_finalized) return false;
  if (!podOpenSlotStatus(pod).open) return false;

  if (pod.founder_user_id && pod.founder_user_id === ctx.userId) return false;
  if (pod.members.some((member) => member.user_id === ctx.userId && member.slot_credit_id !== 'invitation')) {
    return false;
  }

  if (!isGenderCompatible(podEffectiveGender(pod), ctx.gender)) return false;
  if (ctx.bookedListingIds.includes(pod.listing.id)) return false;

  return true;
}

function budgetScore(share: number, ctx: PodMatchContext): number {
  const hasBudget = ctx.minBudget != null || ctx.maxBudget != null;
  if (!hasBudget) return 0;

  const min = ctx.minBudget ?? 0;
  const max = ctx.maxBudget ?? Number.POSITIVE_INFINITY;

  if (share >= min && share <= max) return WEIGHT.budgetInRange;
  if (share < min) return WEIGHT.budgetBelowRange;
  if (share <= max * 1.25) return WEIGHT.budgetNearRange;
  return -WEIGHT.budgetOverRange;
}

function recencyScore(createdAt: string, now: number): number {
  const created = Date.parse(createdAt);
  if (!Number.isFinite(created)) return 0;

  const ageDays = (now - created) / DAY_MS;
  if (ageDays <= 7) return WEIGHT.recentStrong;
  if (ageDays <= 14) return WEIGHT.recentWeak;
  return 0;
}

function computeScore(
  pod: PodWithListing,
  ctx: PodMatchContext,
  now: number,
  seenPodIds: ReadonlySet<string>,
): number {
  const listing = pod.listing;
  let score = 0;

  if (relatedText(normalize(listing.campus), normalize(ctx.school))) {
    score += WEIGHT.campusMatch;
  }

  score += budgetScore(podPerPersonPrice(pod), ctx);

  const area = normalize(ctx.preferredArea);
  if (
    relatedText(area, normalize(listing.location_landmark)) ||
    relatedText(area, normalize(listing.city))
  ) {
    score += WEIGHT.areaMatch;
  }

  score += recencyScore(pod.created_at, now);

  const { available } = podOpenSlotStatus(pod);
  if (available === 1) score += WEIGHT.lastSeat;
  else if (available === 2) score += WEIGHT.twoSeats;

  if (seenPodIds.has(pod.id)) score -= WEIGHT.seenPenalty;

  return score;
}

/** Public single-pod scorer (used by tests and any ad-hoc ranking). */
export function scorePod(pod: PodWithListing, ctx: PodMatchContext, now = Date.now()): number {
  return computeScore(pod, ctx, now, new Set(ctx.seenPodIds));
}

function comparePods(a: RecommendedPod, b: RecommendedPod): number {
  if (b.score !== a.score) return b.score - a.score;

  const aCreated = Date.parse(a.created_at) || 0;
  const bCreated = Date.parse(b.created_at) || 0;
  if (bCreated !== aCreated) return bCreated - aCreated;

  return a.id.localeCompare(b.id);
}

export type RankPodsOptions = {
  limit?: number;
  now?: number;
};

/**
 * Filter to joinable pods, score them, then return the best `limit`.
 * Ordering is deterministic so repeated renders never reshuffle the shelf.
 */
export function rankPods(
  pods: readonly PodWithListing[],
  ctx: PodMatchContext,
  { limit = MAX_SHELF_PODS, now = Date.now() }: RankPodsOptions = {},
): RecommendedPod[] {
  const max = Math.max(0, Math.trunc(limit));
  if (max === 0) return [];

  const seenPodIds = new Set(ctx.seenPodIds);

  return pods
    .filter((pod) => isPodEligible(pod, ctx))
    .map((pod) => ({
      ...pod,
      score: computeScore(pod, ctx, now, seenPodIds),
    }))
    .sort(comparePods)
    .slice(0, max);
}
