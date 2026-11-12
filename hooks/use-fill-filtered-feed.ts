import { useEffect } from 'react';

/** A feed that is paged first and filtered second can look empty while matches sit on later pages. */
export const MIN_VISIBLE_RESULTS = 6;
export const MAX_FILL_PAGES = 8;

interface Input {
  hasActiveFilters: boolean;
  visibleCount: number;
  hasMore: boolean;
  isFetching: boolean;
  pageCount: number;
  loadMore: () => void;
}

export function shouldLoadMoreForFilters({ hasActiveFilters, visibleCount, hasMore, isFetching, pageCount }: Omit<Input, 'loadMore'>): boolean {
  return hasActiveFilters && hasMore && !isFetching && visibleCount < MIN_VISIBLE_RESULTS && pageCount < MAX_FILL_PAGES;
}

/** While filters hide most of what has loaded, keep fetching pages (bounded) until the feed fills. */
export function useFillFilteredFeed(input: Input): void {
  const { loadMore, ...state } = input;
  const needsMore = shouldLoadMoreForFilters(state);
  useEffect(() => {
    if (needsMore) loadMore();
  }, [needsMore, state.pageCount, loadMore]);
}
