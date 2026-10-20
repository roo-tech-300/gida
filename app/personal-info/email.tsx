import { useAuth } from '@/context/auth-context';
import { PersonalInfoFieldScreenCore } from '@/components/profile/personal-info-field-screen';
import { PersonalInfoEmailLockedCard } from '@/components/profile/personal-info-email-locked-card';

/**
 * Email address screen.
 *
 * Locked until 30 days after account creation - read only, no input.
 */
export default function EmailLockedScreen() {
  const { profile } = useAuth();
  const email = profile?.email ?? 'Not available';

  return (
    <PersonalInfoFieldScreenCore
      value={email}
      error={undefined}
      saving={false}
      canSave={false}
      onChange={() => {
      }}
      onSave={() => {
      }}
    >
      <PersonalInfoEmailLockedCard email={email} />
    </PersonalInfoFieldScreenCore>
  );
}
