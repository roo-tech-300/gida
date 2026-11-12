import type { FeedListing } from '@/types/feed-listing';
import {
  activeFilterCount, applyPlaceFilters, filtersFromPreferences, formatBudgetShort, matchesArea, NO_FILTERS,
} from './place-filters';

function listing(overrides: Partial<FeedListing>): FeedListing {
  return {
    id: 'l1', title: 'Royal Lodge', location: 'Opposite Bosso main gate, Minna', price: '', priceAmount: 1_000_000,
    pricePerPerson: 250_000, beds: '', baths: '', size: '', floor: '', status: 'available', description: '', amenities: [],
    photoCount: 0, hasVirtualTour: false, image: '', category: '', featured: false, layoutType: 'flat',
    ...overrides,
  };
}

const royal = listing({});
const prime = listing({ id: 'l2', title: 'Prime Lodge', location: 'Behind Bosso market, Minna', pricePerPerson: 280_000, layoutType: 'self_contain' });
const gk = listing({ id: 'l3', title: 'Gidan Kwano Haven', location: 'GK junction, Minna', pricePerPerson: 220_000, layoutType: 'self_contain' });
const all = [royal, prime, gk];

describe('applyPlaceFilters', () => {
  it('returns everything when no filter is set', () => {
    expect(applyPlaceFilters(all, NO_FILTERS)).toHaveLength(3);
  });
  it('filters by rent per person, not the whole-place price', () => {
    const ids = applyPlaceFilters(all, { ...NO_FILTERS, maxBudget: 250_000 }).map((l) => l.id);
    expect(ids).toEqual(['l1', 'l3']);
  });
  it('filters by layout and area together', () => {
    const ids = applyPlaceFilters(all, { maxBudget: null, area: 'Bosso', layout: 'self_contain' }).map((l) => l.id);
    expect(ids).toEqual(['l2']);
  });
  it('treats GK as Gidan Kwano', () => {
    expect(matchesArea(gk, 'GK')).toBe(true);
    expect(matchesArea(royal, 'GK')).toBe(false);
  });
});

describe('filtersFromPreferences', () => {
  it('prefills budget and area from onboarding, but leaves room type open', () => {
    expect(filtersFromPreferences({ max_budget: 300000, preferred_area: 'Bosso' }))
      .toEqual({ maxBudget: 300000, area: 'Bosso', layout: null });
  });
  it('ignores unknown areas and missing budgets', () => {
    expect(filtersFromPreferences({ max_budget: null, preferred_area: 'Atlantis' })).toEqual(NO_FILTERS);
    expect(filtersFromPreferences(null)).toEqual(NO_FILTERS);
  });
});

describe('labels', () => {
  it('counts active filters', () => {
    expect(activeFilterCount({ maxBudget: 1, area: null, layout: 'flat' })).toBe(2);
  });
  it('shortens budgets', () => {
    expect(formatBudgetShort(250_000)).toBe('₦250k');
    expect(formatBudgetShort(1_000_000)).toBe('₦1M');
    expect(formatBudgetShort(1_500_000)).toBe('₦1.5M');
  });
});
