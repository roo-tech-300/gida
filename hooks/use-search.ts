import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchListings, searchRoommates } from '@/services/search-service';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const STALE_TIME = 15_000;

function useDebouncedValue(value: string): string {
  const [debounced, setDebounced] = useState(value);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => {
      if (ref.current) clearTimeout(ref.current);
    };
  }, [value]);

  return debounced;
}

export function useListingSearch(query: string) {
  const debounced = useDebouncedValue(query);

  return useQuery({
    queryKey: ['search-listings', debounced],
    queryFn: () => searchListings(debounced),
    enabled: debounced.trim().length >= MIN_CHARS,
    staleTime: STALE_TIME,
  });
}

export function useRoommateSearch(query: string) {
  const debounced = useDebouncedValue(query);

  return useQuery({
    queryKey: ['search-roommates', debounced],
    queryFn: () => searchRoommates(debounced),
    enabled: debounced.trim().length >= MIN_CHARS,
    staleTime: STALE_TIME,
  });
}
