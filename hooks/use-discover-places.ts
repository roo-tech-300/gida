import { useCallback, useMemo } from 'react';

import { useAuth } from '@/context/auth-context';
import { useInfiniteListings } from '@/hooks/use-listings';
import { useInfiniteRecommendedListings } from '@/hooks/useRecommendedListings';
import type { FeedListing } from '@/types/feed-listing';

/**
 * The places feed: personalised when the student has preferences that produce matches,
 * otherwise the newest listings. One flat list plus paging state for the screen.
 */
export function useDiscoverPlaces() {
  const { profile } = useAuth();
  const recommended = useInfiniteRecommendedListings(profile?.id);
  const fallback = useInfiniteListings();

  const useRecommended = !!(recommended.data && recommended.data.pages[0]?.length > 0);
  const active = useRecommended ? recommended : fallback;

  const listings = useMemo<FeedListing[]>(() => (active.data?.pages.flat() ?? []) as FeedListing[], [active.data?.pages]);

  const loadMore = useCallback(() => {
    if (active.hasNextPage && !active.isFetchingNextPage) void active.fetchNextPage();
  }, [active]);

  return {
    listings,
    isLoading: active.isLoading,
    isError: active.isError,
    isRefetching: active.isRefetching,
    isFetchingMore: active.isFetchingNextPage,
    refetch: active.refetch,
    loadMore,
  };
}
