import { Redirect } from 'expo-router';

export default function LandingIndexScreen() {
  return <Redirect href="/(auth)/welcome" />;
}
