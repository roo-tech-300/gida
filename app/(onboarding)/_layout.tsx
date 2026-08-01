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
        <Stack.Screen name="preferences-budget" />
        <Stack.Screen name="preferences-layout" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
