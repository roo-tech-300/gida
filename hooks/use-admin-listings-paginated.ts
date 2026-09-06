import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchAdminListingsPaginated, type AdminListing } from '@/services/adminService';

export function useAdminListingsPaginated(limit = 50) {
  return usePaginatedQuery<AdminListing[]>({
    queryKey: ['admin-listings'],
    queryFn: ({ from, to }) => fetchAdminListingsPaginated((from / limit) + 1, limit),
    limit,
    staleTime: 5 * 60 * 1000,
  });
}