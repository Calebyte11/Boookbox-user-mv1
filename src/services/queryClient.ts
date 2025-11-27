import { QueryClient } from "@tanstack/react-query";
import { useApiErrorStore } from "@/store/apiStore";

// Create a React Query client with global error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime)
      retry: 1,
    },
    mutations: {
      retry: false,
      onError: (error: unknown) => {
        const err = error instanceof Error ? error : new Error("Unknown error");
        useApiErrorStore.getState().setError(err);
      },
    },
  },
});
