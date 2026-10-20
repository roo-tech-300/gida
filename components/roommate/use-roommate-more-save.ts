import { useMemo, useState } from 'react';

import { useAppToast } from '@/components/ui/toast-card';
import { useAuth } from '@/context/auth-context';
import { updateRoommatePreferences } from '@/services/roommateProfileService';

export type MoreValues = {
  sleepSchedule: string | null;
  cleanlinessLevel: string | null;
  guestPolicy: string | null;
  studyHabitat: string | null;
  personalityVibe: string | null;
  smokerAllowed: boolean;
  religionPreference: string | null;
};

type Params = {
  userId: string | undefined;
  baseline: string | null;
  dirty: boolean;
  values: MoreValues;
  onSaved: () => void;
};

export function useRoommateMoreSave({ userId, baseline, dirty, values, onSaved }: Params) {
  const { refreshProfile, profile } = useAuth();
  const { showToast } = useAppToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => Boolean(userId) && dirty && !saving, [userId, dirty, saving]);

  const handleSave = async () => {
    if (!userId || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateRoommatePreferences(userId, {
        ...values,
        ownReligion: profile?.religion ?? null,
      });
      onSaved();
      await refreshProfile();
      showToast({ message: 'Roommate preferences updated.', type: 'success' });
    } catch (err) {
      const message = 'Could not save your roommate preferences. Please try again.';
      setError(message);
      showToast({ message, type: 'error' });
      console.error('[RoommateMore] Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  void baseline;
  return { saving, error, canSave, handleSave };
}
