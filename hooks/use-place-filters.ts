import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth-context';
import { fetchMyRoommatePreferences } from '@/services/roommateProfileService';
import { filtersFromPreferences, NO_FILTERS, type PlaceFilters } from '@/utils/place-filters';

const PREFERENCES_STALE_MS = 5 * 60 * 1000;

/** Filter state for the places feed, seeded once from the student's onboarding answers. */
export function usePlaceFilters() {
  const { profile } = useAuth();
  const userId = profile?.id;
  // Same query key as the profile screen, so the preferences are fetched once and shared.
  const { data: preferences } = useQuery({
    queryKey: ['my-roommate-preferences', userId],
    queryFn: () => fetchMyRoommatePreferences(userId ?? ''),
    enabled: !!userId,
    staleTime: PREFERENCES_STALE_MS,
  });

  const [filters, setFilters] = useState<PlaceFilters>(NO_FILTERS);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || !preferences) return;
    seeded.current = true;
    setFilters(filtersFromPreferences(preferences.living));
  }, [preferences]);

  const update = useCallback((patch: Partial<PlaceFilters>) => {
    seeded.current = true; // a student's own choice always wins over the seed
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const clear = useCallback(() => {
    seeded.current = true;
    setFilters(NO_FILTERS);
  }, []);

  return { filters, update, clear };
}
