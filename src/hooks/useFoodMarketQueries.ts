/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  foodMarketService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/foodMarketService";

export const foodMarketQueryKeys = {
  foodMarkets: {
    all: ["foodMarkets"] as const,
    list: (filters?: any) => ["food-market", "list", filters] as const,
    detail: (id: string) => ["food-market", "detail", id] as const,
    nearby: (params: any) => ["food-market", "nearby", params] as const,
    byLocation: (filters: any) => ["food-market", "byLocation", filters] as const,
    products: (rid: string) => ["food-market", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["food-market", rid, "product", mid] as const,
    popularProducts: ["food-market", "popularProducts"] as const,
    popularProductsByFoodMarket: (rid: string) =>
      ["food-market", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["food-market", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllFoodMarketsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.all,
    queryFn: () => foodMarketService.getAllFoodMarket("food-market"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedFoodMarketsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      foodMarketService.getRecommendedFoodMarket(
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

export function useFoodMarketsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.byLocation(filters),
    queryFn: () => foodMarketService.getFoodMarketByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyFoodMarketsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.nearby(params),
    queryFn: () => foodMarketService.getNearbyFoodMarket(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFoodMarketDetailQuery(
  foodMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.detail(foodMarketId),
    queryFn: () => foodMarketService.getFoodMarketById(foodMarketId),
    enabled: options?.enabled !== undefined ? options.enabled : !!foodMarketId,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        return false;
      }
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

export function useFoodMarketProductsQuery(
  foodMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.products(foodMarketId),
    queryFn: () => foodMarketService.getFoodMarketProducts(foodMarketId),
    enabled: options?.enabled !== false && !!foodMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFoodMarketProductInfoQuery(
  foodMarketId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.product(foodMarketId, productId),
    queryFn: () => foodMarketService.getMenuInfo(foodMarketId, productId),
    enabled: options?.enabled !== false && !!foodMarketId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFoodMarketPopularProductsQuery() {
  return useQuery({
    queryKey: foodMarketQueryKeys.foodMarkets.popularProducts,
    queryFn: foodMarketService.getPopularMenus,
  });
}

export function usePopularProductsByFoodMarketQuery(
  foodMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      foodMarketQueryKeys.foodMarkets.popularProductsByFoodMarket(foodMarketId),
    queryFn: () => foodMarketService.getPopularMenusByFoodMarket(foodMarketId),
    enabled: options?.enabled !== false && !!foodMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useFoodMarketReservedProduct = (
  foodMarketId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", foodMarketId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await foodMarketService.findReservedMenu(
        foodMarketId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!foodMarketId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
