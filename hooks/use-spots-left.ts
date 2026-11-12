import { useQuery } from '@tanstack/react-query';

import { fetchSpotsLeft } from '@/services/spots-left-service';

const SPOTS_STALE_MS = 60 * 1000;
const MAX_IDS = 100;

/**
 * Spots left for the listings on screen. One batched call per set of ids, cached for a minute.
 * A failure just hides the badges; the card is still useful without them.
 */
export function useSpotsLeft(listingIds: readonly string[]): Record<string, number> {
  const ids = [...new Set(listingIds)].slice(0, MAX_IDS).sort();
  const { data } = useQuery({
    queryKey: ['spots-left', ids],
    queryFn: () => fetchSpotsLeft(ids),
    enabled: ids.length > 0,
    staleTime: SPOTS_STALE_MS,
  });
  return data ?? {};
}
