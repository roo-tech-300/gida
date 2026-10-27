import { makeDbListing } from '@/dummy/listing-fixture';
import type { FeedListing } from '@/types/feed-listing';
import type { RecommendedPod } from '@/types/pod-recommendation';

import { buildFeedItems, FEED_SHELF_EVERY, FEED_SHELF_FIRST_AT, type FeedItem } from './feed-interleave';

function makeListing(index: number): FeedListing {
  return {
    id: `listing-${index}`,
    title: `Listing ${index}`,
    location: 'Gidan Kwano, Minna',
    price: '₦1,200,000/year',
    beds: '2 Beds',
    baths: '1 Baths',
    size: '400 sqft',
    floor: 'Ground',
    status: 'Available',
    description: '',
    amenities: [],
    photoCount: 0,
    hasVirtualTour: false,
    image: '',
    category: 'Self Contain',
    featured: false,
    layoutType: 'self_contain',
  };
}

function makePod(index: number): RecommendedPod {
  return {
    id: `pod-${index}`,
    estate_id: 'estate-1',
    property_tier: 3,
    matched_gender: 'ANY',
    members: [],
    current_total_intent: 1,
    target_occupancy: 3,
    is_finalized: false,
    created_at: '2026-10-20T00:00:00.000Z',
    listing_id: `listing-${index}`,
    verification_status: 'approved',
    listing: makeDbListing({
      id: `listing-${index}`,
      title: `Pod Listing ${index}`,
      price_amount: 1_200_000,
      property_tier: 3,
      max_roommates: 3,
      campus: 'FUT Minna',
      location_landmark: 'Gidan Kwano',
      city: 'Minna',
    }),
    score: 100 - index,
  };
}

function listings(count: number): FeedListing[] {
  return Array.from({ length: count }, (_, index) => makeListing(index + 1));
}

function pods(count: number): RecommendedPod[] {
  return Array.from({ length: count }, (_, index) => makePod(index + 1));
}

function kinds(items: readonly FeedItem[]): string[] {
  return items.map((item) => item.kind);
}

function shelfPods(items: readonly FeedItem[]): string[][] {
  return items
    .filter((item): item is Extract<FeedItem, { kind: 'pods' }> => item.kind === 'pods')
    .map((item) => item.pods.map((pod) => pod.id));
}

describe('buildFeedItems', () => {
  it('returns the plain reel when there are no pods', () => {
    const items = buildFeedItems(listings(6), []);
    expect(items).toHaveLength(6);
    expect(kinds(items)).toEqual(Array(6).fill('listing'));
  });

  it('places the first shelf after four listings, then every eight', () => {
    const items = buildFeedItems(listings(20), pods(8));
    const sequence = kinds(items);

    expect(FEED_SHELF_FIRST_AT).toBe(4);
    expect(FEED_SHELF_EVERY).toBe(8);
    expect(sequence[4]).toBe('pods');
    // 4 listings + shelf + 8 listings puts the next shelf at index 13.
    expect(sequence[13]).toBe('pods');
    expect(items).toHaveLength(22);
  });

  it('never repeats a pod across shelves', () => {
    const items = buildFeedItems(listings(40), pods(8));
    const shelves = shelfPods(items);
    const flat = shelves.flat();

    expect(shelves).toHaveLength(2);
    expect(shelves[0]).toHaveLength(6);
    expect(shelves[1]).toHaveLength(2);
    expect(new Set(flat).size).toBe(flat.length);
  });

  it('stops inserting shelves once the pods are exhausted', () => {
    const items = buildFeedItems(listings(40), pods(2));
    expect(shelfPods(items)).toHaveLength(1);
    expect(shelfPods(items)[0]).toHaveLength(2);
  });

  it('caps a shelf at six pods', () => {
    const items = buildFeedItems(listings(20), pods(10), { maxPodsPerShelf: 6 });
    expect(shelfPods(items)[0]).toHaveLength(6);
  });

  it('still shows the shelf on a feed shorter than the first break', () => {
    const items = buildFeedItems(listings(2), pods(3));
    expect(kinds(items)).toEqual(['listing', 'listing', 'pods']);
    expect(shelfPods(items)[0]).toHaveLength(3);
  });

  it('does not duplicate the shelf when the feed is exactly the first break', () => {
    const items = buildFeedItems(listings(4), pods(3));
    expect(kinds(items)).toEqual(['listing', 'listing', 'listing', 'listing', 'pods']);
  });

  it('never returns a shelf for an empty feed', () => {
    expect(buildFeedItems([], pods(4))).toEqual([]);
  });

  it('honours custom cadence options', () => {
    const items = buildFeedItems(listings(10), pods(8), { firstAt: 2, every: 3 });
    expect(kinds(items)).toEqual([
      'listing',
      'listing',
      'pods',
      'listing',
      'listing',
      'listing',
      'pods',
      'listing',
      'listing',
      'listing',
      'listing',
      'listing',
    ]);
    expect(shelfPods(items)).toEqual([
      ['pod-1', 'pod-2', 'pod-3', 'pod-4', 'pod-5', 'pod-6'],
      ['pod-7', 'pod-8'],
    ]);
  });

  it('produces unique keys for every row', () => {
    const items = buildFeedItems(listings(30), pods(12));
    const keys = items.map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('preserves the ranked pod order inside a shelf', () => {
    const ranked = pods(3);
    const items = buildFeedItems(listings(4), ranked);
    const shelf = items[4];

    expect(shelf.kind).toBe('pods');
    if (shelf.kind === 'pods') {
      expect(shelf.pods.map((pod) => pod.id)).toEqual(['pod-1', 'pod-2', 'pod-3']);
    }
  });
});
