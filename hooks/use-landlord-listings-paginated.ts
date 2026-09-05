import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchLandlordListingsPaginated } from '@/services/landlord-service';
import type { LandlordListing } from '@/types/landlord';

export function useLandlordListingsPaginated(
  landlordId: string,
  limit = 20,
) {
  return usePaginatedQuery<LandlordListing[]>({
    queryKey: ['landlord-listings', landlordId, limit],
    queryFn: ({ from, to }) =>
      fetchLandlordListingsPaginated(landlordId, (from / limit) + 1, limit),
    limit,
    staleTime: 5 * 60 * 1000,
    enabled: !!landlordId,
  });
}