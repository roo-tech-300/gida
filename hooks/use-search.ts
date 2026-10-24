import { useQuery } from '@tanstack/react-query';
import { searchListings, searchRoommates } from '@/services/search-service';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const STALE_TIME = 15_000;

export function useListingSearch(query: string) {
  const debounced = useDebouncedValue(query, DEBOUNCE_MS);

  return useQuery({
    queryKey: ['search-listings', debounced],
    queryFn: () => searchListings(debounced),
    enabled: debounced.trim().length >= MIN_CHARS,
    staleTime: STALE_TIME,
  });
}

export function useRoommateSearch(query: string) {
  const debounced = useDebouncedValue(query, DEBOUNCE_MS);

  return useQuery({
    queryKey: ['search-roommates', debounced],
    queryFn: () => searchRoommates(debounced),
    enabled: debounced.trim().length >= MIN_CHARS,
    staleTime: STALE_TIME,
  });
}
