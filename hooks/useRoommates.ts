import { useQuery } from '@tanstack/react-query';
import { fetchRoommates } from '@/services/roommateService';

export function useRoommates() {
  return useQuery({
    queryKey: ['roommates'],
    queryFn: fetchRoommates,
    staleTime: 5 * 60 * 1000,
  });
}
