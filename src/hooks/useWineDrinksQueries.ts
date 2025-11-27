/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  wineDrinksService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/wineDrinksService";
// Query key definitions
export const wineDrinksQueryKeys = {
  wineDrinks: {
    all: ["wineDrinks"] as const,
    list: (filters?: any) => ["wine-drinks", "list", filters] as const,
    detail: (id: string) => ["wine-drinks", "detail", id] as const,
    nearby: (params: any) => ["wine-drinks", "nearby", params] as const,
    byLocation: (filters: any) => ["wine-drinks", "byLocation", filters] as const,
    products: (rid: string) => ["wine-drinks", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["wine-drinks", rid, "product", mid] as const,
    popularProducts: ["wine-drinks", "popularProducts"] as const,
    popularProductsByWineDrinks: (rid: string) =>
      ["wine-drinks", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["wine-drinks", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

// Get all wine-drinks
export function useAllWineDrinksQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.all,
    queryFn: () => wineDrinksService.getAllWineDrinks("wine-drinks"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes default
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get recommended wine-drinks
export function useRecommendedWineDrinksQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.recommended(
      // Use 0 as stable placeholder in key when coords are missing
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    // Only call API when coords exist
    queryFn: () =>
      wineDrinksService.getRecommendedWineDrinks(
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

// Get Wine & Drinks by location
export function useWineDrinksByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.byLocation(filters),
    queryFn: () => wineDrinksService.getWineDrinksByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get nearby wine drinks
export function useNearbyWineDrinksQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.nearby(params),
    queryFn: () => wineDrinksService.getNearbyWineDrinks(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useWineDrinksDetailQuery(
  wineDrinksId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.detail(wineDrinksId),
    queryFn: () => wineDrinksService.getWineDrinksById(wineDrinksId),
    enabled: options?.enabled !== undefined ? options.enabled : !!wineDrinksId,
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

// Get wine & drinks products
export function useWineDrinksProductsQuery(
  wineDrinksId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.products(wineDrinksId),
    queryFn: () => wineDrinksService.getWineDrinksProducts(wineDrinksId),
    enabled: options?.enabled !== false && !!wineDrinksId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get specific product item
export function useWineDrinksProductInfoQuery(
  wineDrinksId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.product(wineDrinksId, productId),
    queryFn: () => wineDrinksService.getMenuInfo(wineDrinksId, productId),
    enabled: options?.enabled !== false && !!wineDrinksId && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get popular products wine & drinks
export function useWineDrinksPopularProductsQuery() {
  return useQuery({
    queryKey: wineDrinksQueryKeys.wineDrinks.popularProducts,
    queryFn: wineDrinksService.getPopularMenus,
  });
}

// Get popular products by wine & drinks
export function usePopularProductsByWineDrinksQuery(
  wineDrinksId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      wineDrinksQueryKeys.wineDrinks.popularProductsByWineDrinks(wineDrinksId),
    queryFn: () => wineDrinksService.getPopularMenusByWineDrinks(wineDrinksId),
    enabled: options?.enabled !== false && !!wineDrinksId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// FIND RESERVED GROCERIES product
export const useWineDrinksReservedProduct = (
  wineDrinksId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", wineDrinksId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      // Call service and prefer the actual payload (response.data) when present
      const res = await wineDrinksService.findReservedMenu(
        wineDrinksId ?? "",
        reservationCode ?? ""
      );
      // If API client returned an object with `data`, return that; otherwise return the raw response
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    // Only enable when we have a valid wineDrinksId and a non-empty reservationCode
    enabled:
      !!wineDrinksId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
