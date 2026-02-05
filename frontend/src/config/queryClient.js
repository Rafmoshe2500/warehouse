import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: Unused data stays in cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

export default queryClient;
