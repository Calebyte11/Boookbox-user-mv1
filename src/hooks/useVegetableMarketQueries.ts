
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  vegetableMarketService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/vegetableMarketService";


export const vegetableMarketQueryKeys = {
  vegetableMarkets: {
    all: ["vegetableMarkets"] as const,
    list: (filters?: any) => ["vegetableMarkets", "list", filters] as const,
    detail: (id: string) => ["vegetableMarkets", "detail", id] as const,
    nearby: (params: any) => ["vegetableMarkets", "nearby", params] as const,
    byLocation: (filters: any) => ["vegetableMarkets", "byLocation", filters] as const,
    products: (serviceId: string) => ["vegetableMarkets", serviceId, "products"] as const,
    product: (serviceId: string, productId: string) =>
      ["vegetableMarkets", serviceId, "product", productId] as const,
    popularProducts: ["vegetableMarkets", "popularProducts"] as const,
    popularProductsByVegetableMarket: (serviceId: string) =>
      ["vegetableMarkets", serviceId, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["vegetableMarkets", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllVegetableMarketsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.all,
    queryFn: () => vegetableMarketService.getAllVegetableMarkets("vegetable-market"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedVegetableMarketsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      vegetableMarketService.getRecommendedVegetableMarkets(
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

export function useVegetableMarketsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.byLocation(filters),
    queryFn: () => vegetableMarketService.getVegetableMarketByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyVegetableMarketsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.nearby(params),
    queryFn: () => vegetableMarketService.getNearbyVegetableMarkets(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVegetableMarketDetailQuery(
  vegetableMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.detail(vegetableMarketId),
    queryFn: () => vegetableMarketService.getVegetableMarketById(vegetableMarketId),
    enabled: options?.enabled !== undefined ? options.enabled : !!vegetableMarketId,
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

export function useVegetableMarketServicesQuery(
  vegetableMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.products(vegetableMarketId),
    queryFn: () => vegetableMarketService.getVegetableMarketProducts(vegetableMarketId),
    enabled: options?.enabled !== false && !!vegetableMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVegetableMarketProductInfoQuery(
  vegetableMarketId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.product(vegetableMarketId, productId),
    queryFn: () => vegetableMarketService.getVegetableMarketProduct(vegetableMarketId, productId),
    enabled: options?.enabled !== false && !!vegetableMarketId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useVegetableMarketPopularProductsQuery() {
  return useQuery({
    queryKey: vegetableMarketQueryKeys.vegetableMarkets.popularProducts,
    queryFn: vegetableMarketService.getPopularProducts,
  });
}

export function usePopularProductsByVegetableMarketQuery(
  vegetableMarketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      vegetableMarketQueryKeys.vegetableMarkets.popularProductsByVegetableMarket(vegetableMarketId),
    queryFn: () => vegetableMarketService.getPopularProductsByVegetableMarket(vegetableMarketId),
    enabled: options?.enabled !== false && !!vegetableMarketId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useVegetableMarketReservedProduct = (
  vegetableMarketId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", vegetableMarketId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await vegetableMarketService.findReservedProduct(
        vegetableMarketId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!vegetableMarketId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
