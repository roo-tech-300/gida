import { useCallback, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useAppToast } from '@/components/ui/toast-card';
import { updateProfileBio } from '@/services/profileService';
import { PersonalInfoFieldScreenCore } from '@/components/profile/personal-info-field-screen';
import { getFieldConfig } from '@/components/profile/personal-info-fields';
import { PersonalInfoFieldCard } from '@/components/profile/personal-info-field-card';

/**
 * Bio editor.
 *
 * Persisted to `profiles.bio`.
 */
export default function BioScreen() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useAppToast();
  const userId = profile?.id;

  const [value, setValue] = useState(profile?.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const original = profile?.bio ?? '';
  const canSave = value !== original;

  const handleSave = useCallback(async () => {
    if (value.length > 300) {
      setError('Keep your bio under 300 characters.');
      showToast({ type: 'error', message: 'Keep your bio under 300 characters.' });
      return;
    }
    if (!userId) return;

    setSaving(true);
    try {
      await updateProfileBio(userId, value);
      await refreshProfile();
      setValue(value);
      showToast({ type: 'success', message: 'Your bio has been updated.' });
    } catch (e) {
      console.error('[PersonalInfo] Bio save failed:', e);
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not update your bio.',
      });
    } finally {
      setSaving(false);
    }
  }, [userId, value, refreshProfile, showToast]);

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
        field={getFieldConfig('bio')!}
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
