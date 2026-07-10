import { QueryClient } from '@tanstack/react-query';

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