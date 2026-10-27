import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { fetchAdminListingsPaginated, type AdminListing } from '@/services/adminService';

export function useAdminListingsPaginated(
  limit = 20,
  searchQuery?: string,
  status?: 'all' | 'available' | 'booked',
) {
  return usePaginatedQuery<AdminListing[]>({
    queryKey: ['admin-listings', searchQuery?.trim() ?? '', status ?? 'all'],
    queryFn: ({ from, to }) =>
      fetchAdminListingsPaginated((from / limit) + 1, limit, searchQuery, status),
    limit,
    staleTime: 5 * 60 * 1000,
  });
}