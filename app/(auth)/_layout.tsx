import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DesignColors } from '@/constants/design';

export default function AuthLayout() {
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
