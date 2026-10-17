import { MessageSyncProvider } from '@/components/messages/message-sync-provider';
import { ForegroundNotificationListener } from '@/components/notifications/foreground-notification-listener';
import { NotificationNavigationListener } from '@/components/notifications/notification-navigation-listener';
import { DefaultHead } from '@/components/seo/default-head';
import { SplashScreen } from '@/components/splash/splash-screen';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { ToastProvider } from '@/components/ui/toast-card';
import { DesignColors } from '@/constants/design';
import { IS_APP_LAUNCHED } from '@/constants/launch';
import { AppConfigProvider } from '@/context/app-context';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { OnboardingProvider } from '@/context/onboarding-context';
import { queryClient } from '@/lib/query-clients';
import { checkForAppUpdate } from '@/src/lib/updates/updates';
import { consumePendingPushNavigation } from '@/src/notifications/pending-navigation';
import { useNotificationPermissionPlatform } from '@/src/use-notification-permission-platform';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname, useRouter, useSegments, useGlobalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

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
  const searchParams = useGlobalSearchParams<{ referralCode?: string | string[] }>();
  const referralCodeParam = Array.isArray(searchParams?.referralCode)
    ? searchParams.referralCode[0]
    : searchParams?.referralCode;
  const router = useRouter();
  const pendingPropertyPath = useRef<string | null>(null);
  const pendingReferralPath = useRef<string | null>(null);

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
    const isReferralEntry = pathname === '/referral' || pathname.startsWith('/r/');
    const inAuthGroup = segments[0] === '(auth)';
    const inLandingGroup = segments[0] === '(landing)';
    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isReferralEntry) {
      const query = Object.entries(searchParams ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(Array.isArray(v) ? v[0] ?? '' : v)}`)
        .join('&');
      pendingReferralPath.current = query ? `${pathname}?${query}` : pathname;
      return;
    }

    if (isPublicWebHome || isPublicWebContent || isPublicWebProperty) return;

    if (!isAuthenticated) {
      // A cold-start push may have arrived while logged out — discard it so one
      // user's thread never leaks into the next login. Skip when a session
      // exists but the profile is still loading (offline first run); the push
      // is consumed once auth settles below.
      if (!hasSession) consumePendingPushNavigation();
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
        // Referral entries bypass the coming-soon gate: let the stash survive
        // until ReferralEntry's redirect into (auth) completes.
        if (inAuthGroup && (pendingReferralPath.current || referralCodeParam)) return;
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
      consumePendingPushNavigation();
      router.replace('/(onboarding)');
      return;
    }

    // Deferred cold-start push: the notification tap arrived before auth
    // settled. AuthGate is the single consumer — navigating here guarantees
    // no later replace() can wipe it.
    if (isAuthenticated && profile?.onboarded) {
      const pendingPush = consumePendingPushNavigation();
      if (pendingPush) {
        console.log('[Notifications] AuthGate consuming deferred push navigation to', pendingPush);
        router.push(pendingPush as never);
        return;
      }
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
                    <Stack.Screen name="referral" />
                    <Stack.Screen name="referral-dashboard" />
                    <Stack.Screen name="signup" />
                    <Stack.Screen name="r/[code]" />
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
