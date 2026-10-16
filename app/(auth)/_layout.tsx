import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DesignColors } from '@/constants/design';
import { IS_APP_LAUNCHED } from '@/constants/launch';

export default function AuthLayout() {
  const params = useLocalSearchParams<{ referralCode?: string }>();

  // Block auth screens when app isn't launched yet — but let referral links
  // through so /r/:code → signup still works even in pre-launch mode.
  if (!IS_APP_LAUNCHED && !params.referralCode) {
    return <Redirect href="/(landing)/coming-soon" />;
  }

  return (
    <>
      <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: DesignColors.surfaceContainerLowest },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="verify-reset-code" />
        </Stack>
        <StatusBar style="light" />
      </>
  );
}
