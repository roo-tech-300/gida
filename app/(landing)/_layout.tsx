import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DesignColors } from '@/constants/design';

export default function LandingLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: DesignColors.surfaceContainerLowest },
        }}
      />
      <StatusBar style="light" />
    </>
  );
}
