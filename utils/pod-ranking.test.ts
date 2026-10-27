import { makeDbListing } from '@/dummy/listing-fixture';
import type { DbListing } from '@/types/feed-listing';
import type { Pod, PodMember } from '@/types/liquidity';
import type { PodMatchContext, RecommendedPod } from '@/types/pod-recommendation';

import { isPodEligible, podPerPersonPrice, rankPods, scorePod } from './pod-ranking';

const NOW = Date.parse('2026-10-27T12:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): string {
  return new Date(NOW - days * DAY).toISOString();
}

function member(
  userId: string,
  gender: 'MALE' | 'FEMALE' | null = 'FEMALE',
  slotCreditId = `credit-${userId}`,
): PodMember {
  return {
    user_id: userId,
    full_name: `Member ${userId}`,
    intent_size: 1,
    campus: 'FUT Minna',
    major: 'Computer Science',
    cleanliness_score: 5,
    sleep_schedule: 'Midnight (12 AM)',
    slot_credit_id: slotCreditId,
    profile: { id: userId, full_name: `Member ${userId}`, avatar_url: null, gender },
  };
}

function listing(overrides: Partial<DbListing> = {}): DbListing {
  return makeDbListing({
    price_amount: 1_200_000,
    property_tier: 3,
    max_roommates: 3,
    campus: 'FUT Minna',
    location_landmark: 'Gidan Kwano',
    city: 'Minna',
    ...overrides,
  });
}

type PodOverrides = Partial<Omit<Pod, 'members'>> & {
  members?: PodMember[];
  listing?: DbListing;
};

function pod(overrides: PodOverrides = {}): RecommendedPod {
  const base: RecommendedPod = {
    id: 'pod-1',
    estate_id: 'estate-1',
    property_tier: 3,
    matched_gender: 'FEMALE',
    members: [member('u1')],
    current_total_intent: 1,
    target_occupancy: 3,
    is_finalized: false,
    created_at: daysAgo(1),
    listing_id: 'listing-1',
    verification_status: 'approved',
    listing: listing(),
    score: 0,
  };
  return { ...base, ...overrides };
}

function context(overrides: Partial<PodMatchContext> = {}): PodMatchContext {
  return {
    userId: 'me',
    gender: 'FEMALE',
    school: 'FUT Minna',
    minBudget: null,
    maxBudget: null,
    preferredArea: null,
    bookedListingIds: [],
    seenPodIds: [],
    ...overrides,
  };
}

describe('podPerPersonPrice', () => {
  it('splits the rent across the target occupancy', () => {
    expect(podPerPersonPrice(pod({ target_occupancy: 3 }))).toBe(400_000);
  });

  it('falls back to the listing tier when occupancy is missing', () => {
    expect(podPerPersonPrice(pod({ target_occupancy: 0, listing: listing({ property_tier: 2 }) }))).toBe(600_000);
  });
});

describe('isPodEligible', () => {
  it('accepts an open pod the viewer could join', () => {
    expect(isPodEligible(pod(), context())).toBe(true);
  });

  it('rejects finalized or full pods', () => {
    expect(isPodEligible(pod({ is_finalized: true }), context())).toBe(false);
    expect(
      isPodEligible(pod({ target_occupancy: 2, members: [member('u1'), member('u2')] }), context()),
    ).toBe(false);
  });

  it('counts invited seats as taken', () => {
    const withInvite = pod({
      target_occupancy: 2,
      members: [member('u1'), member('inv-1', null, 'invitation')],
    });
    expect(isPodEligible(withInvite, context())).toBe(false);
  });

  it('rejects the viewer’s own pod and pods they already belong to', () => {
    expect(isPodEligible(pod({ founder_user_id: 'me' }), context())).toBe(false);
    expect(isPodEligible(pod({ members: [member('me'), member('u2')] }), context())).toBe(false);
  });

  it('rejects gender combinations the viewer cannot join', () => {
    const femalePod = pod({ members: [member('u1', 'FEMALE')] });
    expect(isPodEligible(femalePod, context({ gender: 'MALE' }))).toBe(false);

    const mixedPod = pod({ members: [member('u1', 'FEMALE'), member('u2', 'MALE')] });
    expect(isPodEligible(mixedPod, context({ gender: 'FEMALE' }))).toBe(false);

    const undecidedPod = pod({ members: [member('u1', null)] });
    expect(isPodEligible(undecidedPod, context({ gender: 'MALE' }))).toBe(true);
  });

  it('rejects listings the viewer already booked', () => {
    expect(isPodEligible(pod(), context({ bookedListingIds: ['listing-1'] }))).toBe(false);
  });
});

describe('scorePod', () => {
  it('rewards campus and area matches', () => {
    const matching = scorePod(pod(), context({ preferredArea: 'gidan kwano' }), NOW);
    const unrelated = scorePod(
      pod({
        listing: listing({ campus: 'UNILAG', location_landmark: 'Yaba', city: 'Lagos' }),
      }),
      context({ preferredArea: 'gidan kwano' }),
      NOW,
    );

    expect(matching).toBeGreaterThan(unrelated);
    expect(matching - unrelated).toBe(60);
  });

  it('rewards an affordable share and penalises an unaffordable one', () => {
    const affordable = scorePod(pod(), context({ minBudget: 300_000, maxBudget: 500_000 }), NOW);
    const tooExpensive = scorePod(pod(), context({ maxBudget: 150_000 }), NOW);

    expect(affordable).toBeGreaterThan(tooExpensive);
  });

  it('prefers pods with one seat left over pods with two', () => {
    const nearlyFull = pod({ target_occupancy: 2, members: [member('u1')] });
    const roomy = pod({ id: 'pod-2', target_occupancy: 3, members: [member('u1')] });

    expect(scorePod(nearlyFull, context(), NOW)).toBeGreaterThan(scorePod(roomy, context(), NOW));
  });

  it('demotes pods the viewer already opened in this session', () => {
    const fresh = scorePod(pod(), context(), NOW);
    const seen = scorePod(pod(), context({ seenPodIds: ['pod-1'] }), NOW);
    expect(fresh - seen).toBe(25);
  });

  it('fades older pods out of the recency boost', () => {
    const fresh = scorePod(pod({ created_at: daysAgo(1) }), context(), NOW);
    const stale = scorePod(pod({ created_at: daysAgo(40) }), context(), NOW);
    expect(fresh - stale).toBe(10);
  });
});

describe('rankPods', () => {
  it('orders by score and respects the limit', () => {
    const strongMatch = pod({ id: 'strong', listing: listing({ id: 'l-strong' }) });
    const weakMatch = pod({
      id: 'weak',
      listing: listing({ id: 'l-weak', campus: 'UNILAG', location_landmark: 'Yaba', city: 'Lagos' }),
    });

    const ranked = rankPods([weakMatch, strongMatch], context(), { limit: 1, now: NOW });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].id).toBe('strong');
    expect(ranked[0].score).toBeGreaterThan(0);
  });

  it('filters ineligible pods out before ranking', () => {
    const eligible = pod({ id: 'eligible' });
    const own = pod({ id: 'own', founder_user_id: 'me' });

    const ranked = rankPods([own, eligible], context(), { now: NOW });

    expect(ranked.map((item) => item.id)).toEqual(['eligible']);
  });

  it('is deterministic for equal scores', () => {
    const older = pod({ id: 'a-older', created_at: daysAgo(5) });
    const newer = pod({ id: 'b-newer', created_at: daysAgo(2), listing: listing({ id: 'listing-2' }) });

    const first = rankPods([older, newer], context(), { now: NOW }).map((item) => item.id);
    const second = rankPods([older, newer], context(), { now: NOW }).map((item) => item.id);

    expect(first).toEqual(second);
    expect(first[0]).toBe('b-newer');
  });

  it('returns nothing when the limit is zero', () => {
    expect(rankPods([pod()], context(), { limit: 0, now: NOW })).toEqual([]);
  });
});
