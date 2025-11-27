/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  groceriesService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/groceriesService";

// Query key definitions
export const groceriesQueryKeys = {
  groceries: {
    all: ["groceries"] as const,
    list: (filters?: any) => ["groceries", "list", filters] as const,
    detail: (id: string) => ["groceries", "detail", id] as const,
    nearby: (params: any) => ["groceries", "nearby", params] as const,
    byLocation: (filters: any) =>
      ["groceries", "byLocation", filters] as const,
    products: (rid: string) => ["groceries", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["groceries", rid, "product", mid] as const,
    popularProducts: ["groceries", "popularProducts"] as const,
    popularProductsByGroceries: (rid: string) =>
      ["groceries", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["groceries", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

// Get all groceries
export function useAllGroceriesQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.all,
    queryFn: () => groceriesService.getAllGroceries("groceries"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes default
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get recommended groceries
export function useRecommendedGroceriesQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number ,
  page?: number ,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.recommended(
      // Use 0 as stable placeholder in key when coords are missing
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    // Only call API when coords exist
    queryFn: () =>
      groceriesService.getRecommendedGroceries(
        lat as number,
        lng as number,
        category as string,
        limit,
        page
      ),
    enabled: options?.enabled ?? hasCoords,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
  });
}

// Get groceries by location
export function useGroceriesByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.byLocation(filters),
    queryFn: () => groceriesService.getGroceriesByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get nearby groceries
export function useNearbyGroceriesQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.nearby(params),
    queryFn: () => groceriesService.getNearbyGroceries(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}


export function useGroceriesDetailQuery(
  groceriesId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.detail(groceriesId),
    queryFn: () => groceriesService.getGroceriesById(groceriesId),
    enabled: options?.enabled !== undefined ? options.enabled : !!groceriesId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (restaurant not found)
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        return false;
      }
      // Don't retry on auth errors
      if (
        error instanceof Error &&
        (error.message.includes("authentication") ||
          error.message.includes("401"))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// Get groceries products
export function useGroceriesProductsQuery(
  groceriesId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.products(groceriesId),
    queryFn: () => groceriesService.getGroceriesProducts(groceriesId),
    enabled: options?.enabled !== false && !!groceriesId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get specific product item
export function useGroceriesProductInfoQuery(
  groceriesId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.product(groceriesId, productId),
    queryFn: () => groceriesService.getMenuInfo(groceriesId, productId),
    enabled: options?.enabled !== false && !!groceriesId && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get popular products
export function useGroceriesPopularProductsQuery() {
  return useQuery({
    queryKey: groceriesQueryKeys.groceries.popularProducts,
    queryFn: groceriesService.getPopularMenus,
  });
}

// Get popular products by groceries
export function usePopularProductsByGroceriesQuery(
  groceriesId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      groceriesQueryKeys.groceries.popularProductsByGroceries(groceriesId),
    queryFn: () => groceriesService.getPopularMenusByGroceries(groceriesId),
    enabled: options?.enabled !== false && !!groceriesId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// FIND RESERVED GROCERIES product
export const useGroceriesReservedProduct = (groceriesId?: string, reservationCode?: string) =>
  useQuery({
    queryKey: ["reservedProduct", groceriesId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      // Call service and prefer the actual payload (response.data) when present
      const res = await groceriesService.findReservedMenu(
        groceriesId ?? "",
        reservationCode ?? ""
      );
      // If API client returned an object with `data`, return that; otherwise return the raw response
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    // Only enable when we have a valid groceriesId and a non-empty reservationCode
    enabled:
      !!groceriesId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
