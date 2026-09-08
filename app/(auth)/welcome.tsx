import { AuthOptionButton } from '@/components/auth/auth-option-button';
import { AuthWelcomeLayout } from '@/components/auth/auth-welcome-layout';

export default function AuthWelcomeScreen() {
  return (
    <AuthWelcomeLayout>
      <AuthOptionButton label="Sign in with Apple" variant="apple" />

      <AuthOptionButton label="Log in" variant="email" />
    </AuthWelcomeLayout>
  );
}
