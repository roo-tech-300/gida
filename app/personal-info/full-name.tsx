import { useCallback, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useAppToast } from '@/components/ui/toast-card';
import { updateDisplayName } from '@/services/profileService';
import { PersonalInfoFieldScreenCore } from '@/components/profile/personal-info-field-screen';
import { getFieldConfig } from '@/components/profile/personal-info-fields';
import { PersonalInfoFieldCard } from '@/components/profile/personal-info-field-card';

/**
 * Full name editor.
 *
 * Persisted to `profiles.full_name` and to Supabase Auth `display_name`.
 */
export default function FullNameScreen() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useAppToast();
  const userId = profile?.id;

  const [value, setValue] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const original = profile?.full_name ?? '';
  const canSave = value.trim().length >= 2 && value.trim() !== original;

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();

    if (!userId) return;
    if (trimmed.length < 2) {
      setError('Please enter your full name.');
      showToast({ type: 'error', message: 'Please enter your full name.' });
      return;
    }
    if (trimmed === original) {
      showToast({ type: 'info', message: 'Your name is already correct.' });
      return;
    }

    setSaving(true);
    try {
      await updateDisplayName(userId, trimmed);
      await refreshProfile();
      setValue(trimmed);
      showToast({ type: 'success', message: 'Your name has been updated.' });
    } catch (e) {
      console.error('[PersonalInfo] Full name save failed:', e);
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not update your name.',
      });
    } finally {
      setSaving(false);
    }
  }, [userId, value, original, refreshProfile, showToast]);

  return (
    <PersonalInfoFieldScreenCore
      value={value}
      error={error}
      saving={saving}
      canSave={canSave}
      onChange={setValue}
      onSave={handleSave}
    >
      <PersonalInfoFieldCard
        field={getFieldConfig('fullName')!}
        value={value}
        error={error}
        saving={saving}
        canSave={canSave}
        onChange={setValue}
        onSave={handleSave}
      />
    </PersonalInfoFieldScreenCore>
  );
}
