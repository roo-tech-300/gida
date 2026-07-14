import { useQuery } from '@tanstack/react-query';
import { fetchLandlords } from '@/services/landlord-service';

export function useLandlords() {
  return useQuery({
    queryKey: ['landlords'],
    queryFn: fetchLandlords,
  });
}
