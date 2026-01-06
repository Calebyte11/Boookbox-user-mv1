/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  giftStoreService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/giftStoreService";

export const giftStoreQueryKeys = {
  giftStores: {
    all: ["giftStores"] as const,
    list: (filters?: any) => ["gift-stores", "list", filters] as const,
    detail: (id: string) => ["gift-stores", "detail", id] as const,
    nearby: (params: any) => ["gift-stores", "nearby", params] as const,
    byLocation: (filters: any) => ["gift-stores", "byLocation", filters] as const,
    products: (rid: string) => ["gift-stores", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["gift-stores", rid, "product", mid] as const,
    popularProducts: ["gift-stores", "popularProducts"] as const,
    popularProductsByGiftStore: (rid: string) =>
      ["gift-stores", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["gift-stores", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllGiftStoresQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.all,
    queryFn: () => giftStoreService.getAllGiftStores("gift-stores"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedGiftStoresQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      giftStoreService.getRecommendedGiftStores(
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

export function useGiftStoresByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.byLocation(filters),
    queryFn: () => giftStoreService.getGiftStoresByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyGiftStoresQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.nearby(params),
    queryFn: () => giftStoreService.getNearbyGiftStores(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGiftStoreDetailQuery(
  giftStoreId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.detail(giftStoreId),
    queryFn: () => giftStoreService.getGiftStoreById(giftStoreId),
    enabled: options?.enabled !== undefined ? options.enabled : !!giftStoreId,
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

export function useGiftStoreProductsQuery(
  giftStoreId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.products(giftStoreId),
    queryFn: () => giftStoreService.getGiftStoreProducts(giftStoreId),
    enabled: options?.enabled !== false && !!giftStoreId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGiftStoreProductInfoQuery(
  giftStoreId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.product(giftStoreId, productId),
    queryFn: () => giftStoreService.getMenuInfo(giftStoreId, productId),
    enabled: options?.enabled !== false && !!giftStoreId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGiftStorePopularProductsQuery() {
  return useQuery({
    queryKey: giftStoreQueryKeys.giftStores.popularProducts,
    queryFn: giftStoreService.getPopularMenus,
  });
}

export function usePopularProductsByGiftStoreQuery(
  giftStoreId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      giftStoreQueryKeys.giftStores.popularProductsByGiftStore(giftStoreId),
    queryFn: () => giftStoreService.getPopularMenusByGiftStore(giftStoreId),
    enabled: options?.enabled !== false && !!giftStoreId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useGiftStoreReservedProduct = (
  giftStoreId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", giftStoreId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await giftStoreService.findReservedMenu(
        giftStoreId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!giftStoreId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
