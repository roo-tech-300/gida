import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-clients';
import { AppConfigProvider } from '@/context/app-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { OnboardingProvider } from '@/context/onboarding-context';
import { ToastProvider } from '@/components/ui/toast-card';
import { SplashScreen } from '@/components/splash/splash-screen';
import { DesignColors } from '@/constants/design';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (isAuthenticated && !profile?.onboarded && !inOnboardingGroup) {
      router.replace('/(onboarding)/city');
      return;
    }

    if (isAuthenticated && profile?.onboarded && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, profile, segments, router]);

  if (isLoading) return <SplashScreen />;

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <AuthProvider>
          <OnboardingProvider>
            <ToastProvider>
              <AuthGate>
                <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#000000' } }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(onboarding)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="admin/dashboard" />
                  <Stack.Screen name="admin/super-dashboard" />
                  <Stack.Screen name="property/[id]" />
                  <Stack.Screen name="property/tour-scheduler" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="property/tour-pass" options={{ presentation: 'modal' }} />
                  <Stack.Screen name="messages/[id]" />
                  <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                </Stack>
              </AuthGate>
            </ToastProvider>
          </OnboardingProvider>
        </AuthProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
}
