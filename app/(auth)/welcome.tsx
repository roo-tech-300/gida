import { useRouter } from 'expo-router';
import { AuthOptionButton } from '@/components/auth/auth-option-button';
import { AuthWelcomeLayout } from '@/components/auth/auth-welcome-layout';

export default function AuthWelcomeScreen() {
  const router = useRouter();

  const handleCreateAccount = () => {
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  return (
    <AuthWelcomeLayout>
      <AuthOptionButton label="Create Account" variant="apple" showIcon={false} onPress={handleCreateAccount} />
      <AuthOptionButton label="Sign in" variant="phone" showIcon={false} onPress={handleSignIn} />
    </AuthWelcomeLayout>
  );
}
