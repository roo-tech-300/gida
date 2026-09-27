import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { SplashScreen } from '@/components/splash/splash-screen';
import { useAuth } from '@/context/auth-context';
import { IS_APP_LAUNCHED } from '@/constants/launch';

const frameStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
};

export default function WebIndex() {
  const { isLoading, hasSession, profile } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data !== 'navigate:signup' && event.data !== 'navigate:auth') return;

      if (!IS_APP_LAUNCHED) {
        router.push('/(landing)/coming-soon');
      } else if (event.data === 'navigate:signup') {
        router.push('/(auth)/signup');
      } else {
        router.push('/(auth)/welcome');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  if (isLoading) return <SplashScreen />;
  if (hasSession) {
    return profile?.onboarded === false
      ? <Redirect href="/(onboarding)" />
      : <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <iframe ref={iframeRef} src="/landing/index.html" title="Gida" style={frameStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
