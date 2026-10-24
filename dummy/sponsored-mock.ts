import type { SponsoredPlacement } from '@/types/sponsored';

/**
 * Dummy sponsored placements for the Discover feed.
 * Kept out of components so real ad inventory can replace this file later.
 */
export const SPONSORED_PLACEMENTS: SponsoredPlacement[] = [
  {
    id: 'sponsor-hilltop-grill',
    sponsor: 'Hilltop Grill',
    headline: 'Grill nights with a view',
    body: 'Grilled fish, suya platters and cold drinks over Tunga. The table outside is worth the climb.',
    ctaLabel: 'View Hilltop Grill',
    placeId: 'hilltop-grill',
  },
];
