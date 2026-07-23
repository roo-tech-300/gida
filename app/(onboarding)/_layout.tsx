import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DesignColors } from '@/constants/design';

export default function OnboardingLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: DesignColors.surfaceContainerLowest },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="city" />
        <Stack.Screen name="roommate" />
        <Stack.Screen name="living" />
        <Stack.Screen name="verification" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
