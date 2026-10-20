import { useCallback, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useAppToast } from '@/components/ui/toast-card';
import { isUsernameAvailable, normalizeUsername, validateUsernameFormat } from '@/services/username-service';
import { updateProfileUsername } from '@/services/profileService';
import { PersonalInfoFieldScreenCore } from '@/components/profile/personal-info-field-screen';
import { getFieldConfig } from '@/components/profile/personal-info-fields';
import { PersonalInfoFieldCard } from '@/components/profile/personal-info-field-card';

/**
 * Username editor.
 *
 * Validates the format (3-30 lowercase letters, numbers, dots, underscores)
 * and that the handle is not already taken before saving.
 */
export default function UsernameScreen() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useAppToast();
  const userId = profile?.id;

  const [value, setValue] = useState(profile?.username ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const original = profile?.username ?? '';
  const canSave = normalizeUsername(value) !== original;

  const handleSave = useCallback(async () => {
    const normalized = normalizeUsername(value);

    if (!normalized) {
      const message = 'Please pick a username.';
      setError(message);
      showToast({ type: 'error', message });
      return;
    }
    const format = validateUsernameFormat(normalized);
    if (!format.valid) {
      const message =
        format.reason === 'empty'
          ? 'Please pick a username.'
          : '3-30 characters. Use lowercase letters, numbers, dots or underscores.';
      setError(message);
      showToast({ type: 'error', message });
      return;
    }
    if (normalized === original) {
      showToast({ type: 'info', message: 'That is already your username.' });
      return;
    }
    if (!userId) return;

    setSaving(true);
    try {
      const available = await isUsernameAvailable(normalized);
      if (!available) {
        const message = 'That username is already taken. Try another.';
        setError(message);
        showToast({ type: 'error', message });
        return;
      }
      await updateProfileUsername(userId, normalized);
      await refreshProfile();
      setValue(normalized);
      showToast({ type: 'success', message: 'Your username has been updated.' });
    } catch (e) {
      console.error('[PersonalInfo] Username save failed:', e);
      showToast({
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not update your username.',
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
        field={getFieldConfig('username')!}
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
