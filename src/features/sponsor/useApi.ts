import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { get, post, put, del as deleteRequest } from "@/services/apiClient";
import { useApiErrorStore } from "@/store/apiStore";
import type { ApiResponse } from "@/services/apiClient";

/**
 * Hook for fetching data with GET
 * @param key Unique query key or array of keys
 * @param url API endpoint
 * @param options React Query useQuery options
 */
export function useGet<T>(
  key: string | readonly (string | number)[],
  url: string,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const response = await get<T>(url);
      // Extract data from ApiResponse wrapper
      return (response as ApiResponse<T>)?.data ?? (response as T);
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  });
}

/**
 * Hook for creating (POST) data
 * @param url API endpoint
 * @param options React Query useMutation options
 */
export function useCreate<T, B>(
  url: string,
  options?: Omit<UseMutationOptions<T, Error, B>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, B>({
    mutationFn: async (body: B) => {
      const response = await post<T>(url, body);
      // Extract data from ApiResponse wrapper
      return (response as ApiResponse<T>)?.data ?? (response as T);
    },
    onError: (error: Error) => useApiErrorStore.getState().setError(error),
    onSuccess: (data: T, variables: B, context: unknown) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for updating (PUT) data
 */
export function useUpdate<T, B>(
  url: string,
  options?: Omit<UseMutationOptions<T, Error, B>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, B>({
    mutationFn: async (body: B) => {
      const response = await put<T>(url, body);
      // Extract data from ApiResponse wrapper
      return (response as ApiResponse<T>)?.data ?? (response as T);
    },
    onError: (error: Error) => useApiErrorStore.getState().setError(error),
    onSuccess: (data: T, variables: B, context: unknown) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}

/**
 * Hook for deleting (DELETE) data
 */
export function useDelete<T>(
  url: string,
  options?: Omit<UseMutationOptions<T, Error, void>, "mutationFn">
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, void>({
    mutationFn: async () => {
      const response = await deleteRequest<T>(url);
      // Extract data from ApiResponse wrapper
      return (response as ApiResponse<T>)?.data ?? (response as T);
    },
    onError: (error: Error) => useApiErrorStore.getState().setError(error),
    onSuccess: (data: T, variables: void, context: unknown) => {
      queryClient.invalidateQueries();
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
}
