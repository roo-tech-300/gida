import { useQuery } from '@tanstack/react-query';

import { fetchListingsByLandlord } from '@/services/landlord-service';

export function useLandlordListings(landlordId: string | null | undefined) {
  return useQuery({
    queryKey: ['landlord-listings', landlordId],
    queryFn: () => fetchListingsByLandlord(landlordId as string),
    enabled: !!landlordId,
    staleTime: 60 * 1000,
  });
}
