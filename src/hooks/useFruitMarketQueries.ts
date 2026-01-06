/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  fruitMarketService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/fruitMarketService";

export const fruitMarketQueryKeys = {
  fruitMarkets: {
    all: ["fruitMarkets"] as const,
    list: (filters?: any) => ["fruit-market", "list", filters] as const,
    detail: (id: string) => ["fruit-market", "detail", id] as const,
    nearby: (params: any) => ["fruit-market", "nearby", params] as const,
    byLocation: (filters: any) => ["fruit-market", "byLocation", filters] as const,
    products: (rid: string) => ["fruit-market", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["fruit-market", rid, "product", mid] as const,
    popularProducts: ["fruit-market", "popularProducts"] as const,
    popularProductsByFruitMarket: (rid: string) =>
      ["fruit-market", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["fruit-market", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllFruitMarketsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.all,
    queryFn: () => fruitMarketService.getAllFruitMarket("fruit-market"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedFruitMarketsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      fruitMarketService.getRecommendedFruitMarket(
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

export function useFruitMarketsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.byLocation(filters),
    queryFn: () => fruitMarketService.getFruitMarketByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyFruitMarketsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.nearby(params),
    queryFn: () => fruitMarketService.getNearbyFruitMarket(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFruitMarketDetailQuery(
  fruitMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.detail(fruitMarketId),
    queryFn: () => fruitMarketService.getFruitMarketById(fruitMarketId),
    enabled: options?.enabled !== undefined ? options.enabled : !!fruitMarketId,
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

export function useFruitMarketProductsQuery(
  fruitMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.products(fruitMarketId),
    queryFn: () => fruitMarketService.getFruitMarketProducts(fruitMarketId),
    enabled: options?.enabled !== false && !!fruitMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFruitMarketProductInfoQuery(
  fruitMarketId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.product(fruitMarketId, productId),
    queryFn: () => fruitMarketService.getMenuInfo(fruitMarketId, productId),
    enabled: options?.enabled !== false && !!fruitMarketId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFruitMarketPopularProductsQuery() {
  return useQuery({
    queryKey: fruitMarketQueryKeys.fruitMarkets.popularProducts,
    queryFn: fruitMarketService.getPopularMenus,
  });
}

export function usePopularProductsByFruitMarketQuery(
  fruitMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      fruitMarketQueryKeys.fruitMarkets.popularProductsByFruitMarket(fruitMarketId),
    queryFn: () => fruitMarketService.getPopularMenusByFruitMarket(fruitMarketId),
    enabled: options?.enabled !== false && !!fruitMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useFruitMarketReservedProduct = (
  fruitMarketId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", fruitMarketId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await fruitMarketService.findReservedMenu(
        fruitMarketId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!fruitMarketId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
