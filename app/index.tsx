import { SplashScreen } from '@/components/splash/splash-screen';
import { useAuth } from '@/context/auth-context';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isLoading, hasSession, profile } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (hasSession) {
    if (profile?.onboarded === false) {
      return <Redirect href="/(onboarding)" />;
    }

    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(landing)" />;
}

