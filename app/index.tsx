import { Platform } from 'react-native';
import { Redirect } from 'expo-router';

export default function Index() {
  const isWeb = Platform.OS === 'web';
  return <Redirect href={isWeb ? '/(landing)' : '/(auth)/welcome'} />;
}

