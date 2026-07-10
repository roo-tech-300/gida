  import { Link } from 'expo-router';

import { AuthOptionButton } from '@/components/auth/auth-option-button';
import { AuthWelcomeLayout } from '@/components/auth/auth-welcome-layout';

export default function AuthWelcomeScreen() {
  const handleAppleSignIn = () => {
    // UI only — wire to Apple auth later
  };

  const handlePhoneContinue = () => {
    // UI only — wire to phone auth later
  };

  return (
    <AuthWelcomeLayout>
      <AuthOptionButton label="Sign in with Apple" variant="apple" onPress={handleAppleSignIn} />
      <AuthOptionButton label="Continue with Phone" variant="phone" onPress={handlePhoneContinue} />

      <Link href="/login" asChild>
        <AuthOptionButton label="Continue with Email" variant="email" />
      </Link>
    </AuthWelcomeLayout>
  );
}
