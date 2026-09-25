import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DesignColors } from '@/constants/design';
import { IS_APP_LAUNCHED } from '@/constants/launch';

export default function AuthLayout() {
  if (!IS_APP_LAUNCHED) {
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
        </Stack>
        <StatusBar style="light" />
      </>
  );
}
