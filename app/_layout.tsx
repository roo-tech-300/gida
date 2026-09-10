import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-clients';
import { AppConfigProvider } from '@/context/app-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { OnboardingProvider } from '@/context/onboarding-context';
import { ToastProvider } from '@/components/ui/toast-card';
import { MessageSyncProvider } from '@/components/messages/message-sync-provider';
import { SplashScreen } from '@/components/splash/splash-screen';
import { DesignColors } from '@/constants/design';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, isAuthenticated, hasSession } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isWeb = Platform.OS === 'web';
    const inAuthGroup = segments[0] === '(auth)';
    const inLandingGroup = segments[0] === '(landing)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated) {
      // Valid session but the profile row hasn't loaded yet (e.g. offline on
      // first run): best-effort homepage. The profile fills in silently when
      // connectivity returns, and routing re-evaluates then.
      if (hasSession) {
        if (!inTabsGroup) {
          router.replace('/(tabs)');
        }
        return;
      }
      if (isWeb) {
        if (!inLandingGroup && !inAuthGroup) {
          router.replace('/(landing)');
        }
        return;
      }
      if (!inAuthGroup) {
        router.replace('/(auth)/welcome');
      }
      return;
    }

    if (isAuthenticated && !profile?.onboarded && !inOnboardingGroup) {
      router.replace('/(onboarding)');
      return;
    }

    if (isAuthenticated && profile?.onboarded && (inAuthGroup || inOnboardingGroup || inLandingGroup)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isAuthenticated, hasSession, profile, segments, router]);

  if (isLoading) return <SplashScreen />;

  return <>{children}</>;
}

export default function RootLayout() {
  console.log('[PROBE] RootLayout rendered');
  return (
    <QueryClientProvider client={queryClient}>
      <AppConfigProvider>
        <AuthProvider>
          <OnboardingProvider>
            <ToastProvider>
              <MessageSyncProvider>
                <AuthGate>
                  <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: DesignColors.surfaceContainerLowest } }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(landing)" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(onboarding)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="property/[id]" />
                    <Stack.Screen name="property/claim-room" />
                    <Stack.Screen name="property/lobby" />
                    <Stack.Screen name="property/tour-scheduler" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="property/tour-pass" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="property/tour-history" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="messages/[id]" />
                    <Stack.Screen name="roommate/[id]" />
                    <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
                  </Stack>
                </AuthGate>
              </MessageSyncProvider>
            </ToastProvider>
          </OnboardingProvider>
        </AuthProvider>
      </AppConfigProvider>
    </QueryClientProvider>
  );
}
