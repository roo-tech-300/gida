import { Redirect } from 'expo-router';

import { IS_APP_LAUNCHED } from '@/constants/launch';

export default function LandingIndexScreen() {
  if (!IS_APP_LAUNCHED) {
    return <Redirect href="/(landing)/coming-soon" />;
  }
  return <Redirect href="/(auth)/welcome" />;
}
