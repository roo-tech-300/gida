import React, { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-clients';
import { AppConfigProvider } from '@/context/app-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { OnboardingProvider } from '@/context/onboarding-context';
import { ToastProvider } from '@/components/ui/toast-card';
import { MessageSyncProvider } from '@/components/messages/message-sync-provider';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { DefaultHead } from '@/components/seo/default-head';
import { SplashScreen } from '@/components/splash/splash-screen';
import { DesignColors } from '@/constants/design';
import { IS_APP_LAUNCHED } from '@/constants/launch';
import { ForegroundNotificationListener } from '@/components/notifications/foreground-notification-listener';
import { useNotificationPermissionPlatform } from '@/src/use-notification-permission-platform';
import { NotificationNavigationListener } from '@/components/notifications/notification-navigation-listener';
import { checkForAppUpdate } from '@/src/lib/updates/updates';

const PUBLIC_WEB_CONTENT_PATHS: readonly string[] = [
  '/housing/minna',
  '/housing/gidan-kwano',
  '/housing/bosso',
  '/guides/how-to-find-house-minna',
];

function AuthGate({ children }: { children: React.ReactNode }) {
  const { profile, isLoading, isAuthenticated, hasSession } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const pendingPropertyPath = useRef<string | null>(null);

  useEffect(() => {
    const isWeb = Platform.OS === 'web';
    const isPropertyPath = /^\/property\/[^/]+\/?$/.test(pathname);
    if (!isWeb && isPropertyPath && (!isAuthenticated || !profile?.onboarded)) {
      pendingPropertyPath.current = pathname;
    }
    if (isLoading) return;

    const isPublicWebHome = isWeb && pathname === '/';
    const isPublicWebContent = isWeb && PUBLIC_WEB_CONTENT_PATHS.includes(pathname);
    const isPublicWebProperty = isWeb && /^\/property\/[^/]+\/?$/.test(pathname);
    const inAuthGroup = segments[0] === '(auth)';
    const inLandingGroup = segments[0] === '(landing)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isPublicWebHome || isPublicWebContent || isPublicWebProperty) return;

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
      if (!IS_APP_LAUNCHED) {
        if (!inLandingGroup) {
          router.replace('/(landing)/coming-soon');
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

    if (isAuthenticated && profile?.onboarded && (
      inAuthGroup || inOnboardingGroup || inLandingGroup || pendingPropertyPath.current !== null
    )) {
      const requestedProperty = pendingPropertyPath.current;
      pendingPropertyPath.current = null;
      router.replace(requestedProperty ? (requestedProperty as never) : '/(tabs)');
    }
  }, [isLoading, isAuthenticated, hasSession, profile, segments, pathname, router]);

  if (isLoading) return <SplashScreen />;

  return <>{children}</>;
}

export default function RootLayout() {
  useNotificationPermissionPlatform();

  useEffect(() => {
    void checkForAppUpdate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DefaultHead />
      <AppConfigProvider>
        <AuthProvider>
          <OnboardingProvider>
            <ToastProvider>
              <ForegroundNotificationListener />
              <NotificationNavigationListener />
              <OfflineBanner />
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
