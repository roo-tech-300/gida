import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { useRoommates } from '@/hooks/useRoommates';
import { fetchMyRoommatePreferences } from '@/services/roommateService';
import { computeCompatibility } from '@/utils/roommateCompatibility';
import type { RoommateProfile } from '@/types/roommates';

export interface PersonMatch {
  person: RoommateProfile;
  /** 0-100, or null when the viewer has not filled in their own preferences yet. */
  matchPercent: number | null;
}

const PREFERENCES_STALE_MS = 5 * 60 * 1000;

/** Other students, best match first, scored with the same rules as the profile page. */
export function usePeopleFeed() {
  const { profile } = useAuth();
  const myId = profile?.id;
  const roommates = useRoommates();
  const mine = useQuery({
    queryKey: ['my-match-preferences', myId],
    queryFn: () => fetchMyRoommatePreferences(myId ?? ''),
    enabled: !!myId,
    staleTime: PREFERENCES_STALE_MS,
  });

  const people = useMemo<PersonMatch[]>(() => {
    const others = (roommates.data ?? []).filter((person) => person.id !== myId);
    return others
      .map((person) => {
        const match = computeCompatibility(mine.data ?? null, person);
        return { person, matchPercent: match.isReady ? match.score : null };
      })
      .sort((a, b) => (b.matchPercent ?? -1) - (a.matchPercent ?? -1));
  }, [roommates.data, mine.data, myId]);

  return {
    people,
    isLoading: roommates.isLoading,
    isError: roommates.isError,
    isRefetching: roommates.isRefetching,
    refetch: roommates.refetch,
  };
}
