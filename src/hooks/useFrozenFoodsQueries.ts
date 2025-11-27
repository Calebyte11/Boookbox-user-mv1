/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  frozenFoodsService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/frozenFoodService";

// Query key definitions
export const frozenFoodsQueryKeys = {
  frozenFoods: {
    all: ["frozenFoods"] as const,
    list: (filters?: any) => ["frozen-foods", "list", filters] as const,
    detail: (id: string) => ["frozen-foods", "detail", id] as const,
    nearby: (params: any) => ["frozen-foods", "nearby", params] as const,
    byLocation: (filters: any) => ["frozen-foods", "byLocation", filters] as const,
    products: (rid: string) => ["frozen-foods", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["frozen-foods", rid, "product", mid] as const,
    popularProducts: ["frozen-foods", "popularProducts"] as const,
    popularProductsByFrozenFoods: (rid: string) =>
      ["frozen-foods", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["frozen-foods", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

// Get all frozen foods
export function useAllFrozenFoodsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.all,
    queryFn : () => frozenFoodsService.getAllFrozenFoods("frozen-foods"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes default
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

// Get recommended frozen foods
export function useRecommendedFrozenFoodsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.recommended(
      // Use 0 as stable placeholder in key when coords are missing
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    // Only call API when coords exist
    queryFn: () =>
      frozenFoodsService.getRecommendedFrozenFoods(
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

// Get frozen foods by location
export function useFrozenFoodsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.byLocation(filters),
    queryFn: () => frozenFoodsService.getFrozenFoodsByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get nearby frozen foods
export function useNearbyFrozenFoodsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.nearby(params),
    queryFn: () => frozenFoodsService.getNearbyFrozenFoods(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useFrozenFoodsDetailQuery(
  frozenFoodsId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.detail(frozenFoodsId),
    queryFn: () => frozenFoodsService.getFrozenFoodsById(frozenFoodsId),
    enabled: options?.enabled !== undefined ? options.enabled : !!frozenFoodsId,
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

// Get frozen food products
export function useFrozenFoodsProductsQuery(
  frozenFoodsId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.products(frozenFoodsId),
    queryFn: () => frozenFoodsService.getFrozenFoodsProducts(frozenFoodsId),
    enabled: options?.enabled !== false && !!frozenFoodsId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get specific product item
export function useFrozenFoodsProductInfoQuery(
  frozenFoodsId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.product(frozenFoodsId, productId),
    queryFn: () => frozenFoodsService.getMenuInfo(frozenFoodsId, productId),
    enabled: options?.enabled !== false && !!frozenFoodsId && !!productId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get popular products for frozen foods
export function useFrozenFoodsPopularProductsQuery() {
  return useQuery({
    queryKey: frozenFoodsQueryKeys.frozenFoods.popularProducts,
    queryFn: frozenFoodsService.getPopularMenus,
  });
}

// Get popular products by frozen foods
export function usePopularProductsByFrozenFoodsQuery(
  frozenFoodsId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      frozenFoodsQueryKeys.frozenFoods.popularProductsByFrozenFoods(frozenFoodsId),
    queryFn: () => frozenFoodsService.getPopularMenusByFrozenFoods(frozenFoodsId),
    enabled: options?.enabled !== false && !!frozenFoodsId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// FIND RESERVED GROCERIES product
export const useFrozenFoodsReservedProduct = (
  frozenFoodsId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", frozenFoodsId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      // Call service and prefer the actual payload (response.data) when present
      const res = await frozenFoodsService.findReservedMenu(
        frozenFoodsId ?? "",
        reservationCode ?? ""
      );
      // If API client returned an object with `data`, return that; otherwise return the raw response
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    // Only enable when we have a valid frozenFoodsId and a non-empty reservationCode
    enabled:
      !!frozenFoodsId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
