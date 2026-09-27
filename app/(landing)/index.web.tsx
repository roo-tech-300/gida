import { Redirect } from 'expo-router';

import { IS_APP_LAUNCHED } from '@/constants/launch';

/**
 * Keep the web landing route aligned with the native launch gate.
 */
export default function LandingIndexScreen() {
  return IS_APP_LAUNCHED ? <Redirect href="/(auth)/welcome" /> : <Redirect href="/(landing)/coming-soon" />;
}
