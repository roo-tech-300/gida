import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchLandlordsPaginated } from '@/services/landlord-service';
import type { LandlordWithCount } from '@/services/landlord-service';

export function useLandlordsPaginated(limit = 50) {
  return usePaginatedQuery<LandlordWithCount[]>({
    queryKey: ['landlords'],
    queryFn: ({ from, to }) => fetchLandlordsPaginated((from / limit) + 1, limit),
    limit,
    staleTime: 5 * 60 * 1000,
  });
}