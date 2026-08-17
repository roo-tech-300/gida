import { useQuery } from '@tanstack/react-query';
import { fetchMyRoommatePreferences, fetchRoommateById } from '@/services/roommateService';
import { computeCompatibility } from '@/utils/roommateCompatibility';

export function useRoommateProfile(roommateId: string, myId?: string) {
  return useQuery({
    queryKey: ['roommate', roommateId],
    queryFn: async () => {
      const roommate = await fetchRoommateById(roommateId);
      if (!roommate) throw new Error('Roommate profile could not be loaded.');
      const mine = myId ? await fetchMyRoommatePreferences(myId) : null;
      const match = computeCompatibility(mine, roommate);
      return { roommate, match };
    },
    enabled: Boolean(roommateId),
    staleTime: 5 * 60 * 1000,
  });
}
