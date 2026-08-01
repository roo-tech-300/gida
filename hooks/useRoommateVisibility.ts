import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  saveRoommateProfile,
  type RoommateOnboardingData,
} from '@/services/roommateProfileService';

export function useRoommateVisibility() {
  const { profile, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsOnboarding = !profile?.show_in_roommate_feed;

  const markComplete = async (data: RoommateOnboardingData) => {
    if (!profile?.id) throw new Error('User not authenticated');
    setIsSubmitting(true);
    try {
      await saveRoommateProfile(profile.id, data);
      await refreshProfile();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { needsOnboarding, isSubmitting, markComplete };
}
