import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

export default function LandingIndexScreen() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data === 'navigate:signup') {
        router.replace('/(auth)/signup');
      } else if (e.data === 'navigate:auth') {
        router.replace('/(auth)/welcome');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router]);

  return (
    <iframe
      ref={iframeRef}
      src="/landing/index.html"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
      }}
      title="Gida Landing"
    />
  );
}
