import { FUT_MINNA_AREAS } from '@/types/onboarding';
import type { FeedListing } from '@/types/feed-listing';

export type LayoutFilter = 'self_contain' | 'single_room' | 'flat';

export interface PlaceFilters {
  /** Max rent per person per year, in naira. */
  maxBudget: number | null;
  area: string | null;
  layout: LayoutFilter | null;
}

export interface LivingPreferencesLike {
  max_budget?: number | null;
  preferred_area?: string | null;
}

export const NO_FILTERS: PlaceFilters = { maxBudget: null, area: null, layout: null };

export const BUDGET_STEPS = [150_000, 250_000, 350_000, 500_000, 1_000_000] as const;

export const LAYOUT_LABELS: Record<LayoutFilter, string> = {
  self_contain: 'Self-contain',
  single_room: 'Single room',
  flat: '2-bed flat',
};

// "GK" is how students say Gidan Kwano; listings spell it out.
const AREA_KEYWORDS: Record<string, string[]> = { GK: ['gk', 'gidan kwano'] };

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentions(text: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i').test(text);
}

export function matchesArea(listing: FeedListing, area: string): boolean {
  const haystack = `${listing.location} ${listing.title}`;
  return (AREA_KEYWORDS[area] ?? [area]).some((keyword) => mentions(haystack, keyword));
}

export function applyPlaceFilters(listings: readonly FeedListing[], filters: PlaceFilters): FeedListing[] {
  return listings.filter((listing) => {
    if (filters.maxBudget !== null && listing.pricePerPerson > filters.maxBudget) return false;
    if (filters.layout !== null && listing.layoutType !== filters.layout) return false;
    if (filters.area !== null && !matchesArea(listing, filters.area)) return false;
    return true;
  });
}

export function activeFilterCount(filters: PlaceFilters): number {
  return [filters.maxBudget, filters.area, filters.layout].filter((value) => value !== null).length;
}

/**
 * Start from what the student told us in onboarding: budget and area only.
 * Room type stays open on purpose. Prefilling it too would hide most listings.
 */
export function filtersFromPreferences(living: LivingPreferencesLike | null | undefined): PlaceFilters {
  if (!living) return NO_FILTERS;
  const area = (FUT_MINNA_AREAS as readonly string[]).includes(living.preferred_area ?? '') ? living.preferred_area ?? null : null;
  const budget = Number(living.max_budget);
  return { maxBudget: Number.isFinite(budget) && budget > 0 ? budget : null, area, layout: null };
}

/** ₦250,000 → "₦250k", ₦1,000,000 → "₦1M". */
export function formatBudgetShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${Number((amount / 1_000_000).toFixed(1))}M`;
  return `₦${Math.round(amount / 1000)}k`;
}
