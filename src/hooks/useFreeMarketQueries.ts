/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  freeMarketService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/freeMarketService";

export const freeMarketQueryKeys = {
  freeMarkets: {
    all: ["freeMarkets"] as const,
    list: (filters?: any) => ["free-market", "list", filters] as const,
    detail: (id: string) => ["free-market", "detail", id] as const,
    nearby: (params: any) => ["free-market", "nearby", params] as const,
    byLocation: (filters: any) => ["free-market", "byLocation", filters] as const,
    products: (rid: string) => ["free-market", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["free-market", rid, "product", mid] as const,
    popularProducts: ["free-market", "popularProducts"] as const,
    popularProductsByFreeMarket: (rid: string) =>
      ["free-market", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["free-market", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllFreeMarketsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.all,
    queryFn: () => freeMarketService.getAllFreeMarkets("free-market"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedFreeMarketsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      freeMarketService.getRecommendedFreeMarkets(
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

export function useFreeMarketsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.byLocation(filters),
    queryFn: () => freeMarketService.getFreeMarketsByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyFreeMarketsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.nearby(params),
    queryFn: () => freeMarketService.getNearbyFreeMarkets(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFreeMarketDetailQuery(
  freeMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.detail(freeMarketId),
    queryFn: () => freeMarketService.getFreeMarketById(freeMarketId),
    enabled: options?.enabled !== undefined ? options.enabled : !!freeMarketId,
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

export function useFreeMarketProductsQuery(
  freeMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.products(freeMarketId),
    queryFn: () => freeMarketService.getFreeMarketProducts(freeMarketId),
    enabled: options?.enabled !== false && !!freeMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFreeMarketProductInfoQuery(
  freeMarketId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.product(freeMarketId, productId),
    queryFn: () => freeMarketService.getMenuInfo(freeMarketId, productId),
    enabled: options?.enabled !== false && !!freeMarketId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFreeMarketPopularProductsQuery() {
  return useQuery({
    queryKey: freeMarketQueryKeys.freeMarkets.popularProducts,
    queryFn: freeMarketService.getPopularMenus,
  });
}

export function usePopularProductsByFreeMarketQuery(
  freeMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      freeMarketQueryKeys.freeMarkets.popularProductsByFreeMarket(freeMarketId),
    queryFn: () => freeMarketService.getPopularMenusByFreeMarket(freeMarketId),
    enabled: options?.enabled !== false && !!freeMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useFreeMarketReservedProduct = (
  freeMarketId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", freeMarketId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await freeMarketService.findReservedMenu(
        freeMarketId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!freeMarketId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
