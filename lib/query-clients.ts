import { QueryClient, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

// Let TanStack pause queries while offline and resume on reconnect instead of
// flashing error states — part of the "user notices nothing" behavior.
onlineManager.setEventListener((setOnline) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
  return unsubscribe;
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache entries stay fresh for 5 minutes
      gcTime: 1000 * 60 * 30,    // Unused garbage data is cleared after 30 minutes
      retry: 1,                 // Safe network failure retry count
      refetchOnWindowFocus: false,
    },
  },
});