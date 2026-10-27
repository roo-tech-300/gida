export type SponsoredPlacement = {
  id: string;
  sponsor: string;
  headline: string;
  body: string;
  ctaLabel: string;
  /** Existing place this sponsored card points to. */
  placeId: string;
};
