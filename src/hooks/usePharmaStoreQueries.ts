/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  pharmaStoreService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/pharmaStoreService";

export const pharmaStoreQueryKeys = {
  pharmaStores: {
    all: ["pharmaStores"] as const,
    list: (filters?: any) => ["pharmacy", "list", filters] as const,
    detail: (id: string) => ["pharmacy", "detail", id] as const,
    nearby: (params: any) => ["pharmacy", "nearby", params] as const,
    byLocation: (filters: any) => ["pharmacy", "byLocation", filters] as const,
    products: (rid: string) => ["pharmacy", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["pharmacy", rid, "product", mid] as const,
    popularProducts: ["pharmacy", "popularProducts"] as const,
    popularProductsByPharmaStore: (rid: string) =>
      ["pharmacy", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["pharmacy", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllPharmaStoresQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.all,
    queryFn: () => pharmaStoreService.getAllPharmaStores("pharmacy"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedPharmaStoresQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      pharmaStoreService.getRecommendedPharmaStores(
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

export function usePharmaStoresByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.byLocation(filters),
    queryFn: () => pharmaStoreService.getPharmaStoresByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyPharmaStoresQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.nearby(params),
    queryFn: () => pharmaStoreService.getNearbyPharmaStores(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePharmaStoreDetailQuery(
  pharmaStoreId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.detail(pharmaStoreId),
    queryFn: () => pharmaStoreService.getPharmaStoreById(pharmaStoreId),
    enabled: options?.enabled !== undefined ? options.enabled : !!pharmaStoreId,
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

export function usePharmaStoreProductsQuery(
  pharmaStoreId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.products(pharmaStoreId),
    queryFn: () => pharmaStoreService.getPharmaStoreProducts(pharmaStoreId),
    enabled: options?.enabled !== false && !!pharmaStoreId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePharmaStoreProductInfoQuery(
  pharmaStoreId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.product(pharmaStoreId, productId),
    queryFn: () => pharmaStoreService.getMenuInfo(pharmaStoreId, productId),
    enabled: options?.enabled !== false && !!pharmaStoreId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePharmaStorePopularProductsQuery() {
  return useQuery({
    queryKey: pharmaStoreQueryKeys.pharmaStores.popularProducts,
    queryFn: pharmaStoreService.getPopularMenus,
  });
}

export function usePopularProductsByPharmaStoreQuery(
  pharmaStoreId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      pharmaStoreQueryKeys.pharmaStores.popularProductsByPharmaStore(pharmaStoreId),
    queryFn: () => pharmaStoreService.getPopularMenusByPharmaStore(pharmaStoreId),
    enabled: options?.enabled !== false && !!pharmaStoreId,
    staleTime: 1000 * 60 * 5,
  });
}

export const usePharmaStoreReservedProduct = (
  pharmaStoreId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", pharmaStoreId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await pharmaStoreService.findReservedMenu(
        pharmaStoreId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!pharmaStoreId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
