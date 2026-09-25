import { useMemo } from 'react';
import type { AuthProfile } from '@/context/auth-context';
import type { fetchMyRoommatePreferences } from '@/services/roommateProfileService';

type MyRoommatePreferences = Awaited<ReturnType<typeof fetchMyRoommatePreferences>>;

export function useRoommateCompletion(
  preferences: MyRoommatePreferences | undefined,
  profile: AuthProfile | null,
) {
  return useMemo(() => {
    const roommate = preferences?.roommate;
    const living = preferences?.living;
    const fields = [
      roommate?.sleep_schedule,
      roommate?.cleanliness_level,
      roommate?.guest_policy,
      roommate?.study_habitat,
      roommate?.personality_vibe,
      living?.min_budget,
      living?.max_budget,
      living?.preferred_area,
      profile?.bio,
      profile?.school,
    ];
    const filled = fields.filter((value) => {
      if (typeof value === 'number') return true;
      return Boolean(value && String(value).trim());
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [preferences, profile?.bio, profile?.school]);
}
