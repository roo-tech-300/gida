import { MAX_FILL_PAGES, MIN_VISIBLE_RESULTS, shouldLoadMoreForFilters } from './use-fill-filtered-feed';

const base = { hasActiveFilters: true, visibleCount: 1, hasMore: true, isFetching: false, pageCount: 1 };

describe('shouldLoadMoreForFilters', () => {
  it('loads more when filters leave the feed sparse', () => {
    expect(shouldLoadMoreForFilters(base)).toBe(true);
  });
  it('stops when the feed is full, nothing is left, or a page is loading', () => {
    expect(shouldLoadMoreForFilters({ ...base, visibleCount: MIN_VISIBLE_RESULTS })).toBe(false);
    expect(shouldLoadMoreForFilters({ ...base, hasMore: false })).toBe(false);
    expect(shouldLoadMoreForFilters({ ...base, isFetching: true })).toBe(false);
  });
  it('never fills when no filter is active, and never loops forever', () => {
    expect(shouldLoadMoreForFilters({ ...base, hasActiveFilters: false })).toBe(false);
    expect(shouldLoadMoreForFilters({ ...base, pageCount: MAX_FILL_PAGES })).toBe(false);
  });
});
