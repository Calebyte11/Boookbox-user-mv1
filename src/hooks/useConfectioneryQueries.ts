/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  confectioneryService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/confectioneryService";

export const confectioneryQueryKeys = {
  confectioneries: {
    all: ["confectioneries"] as const,
    list: (filters?: any) => ["confectioneries", "list", filters] as const,
    detail: (id: string) => ["confectioneries", "detail", id] as const,
    nearby: (params: any) => ["confectioneries", "nearby", params] as const,
    byLocation: (filters: any) => ["confectioneries", "byLocation", filters] as const,
    products: (rid: string) => ["confectioneries", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["confectioneries", rid, "product", mid] as const,
    popularProducts: ["confectioneries", "popularProducts"] as const,
    popularProductsByConfectionery: (rid: string) =>
      ["confectioneries", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["confectioneries", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllConfectioneriesQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.all,
    queryFn: () => confectioneryService.getAllConfectioneries("confectioneries"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedConfectioneriesQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      confectioneryService.getRecommendedConfectioneries(
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

export function useConfectioneriesByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.byLocation(filters),
    queryFn: () => confectioneryService.getConfectioneriesByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyConfectioneriesQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.nearby(params),
    queryFn: () => confectioneryService.getNearbyConfectioneries(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useConfectioneryDetailQuery(
  confectioneryId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.detail(confectioneryId),
    queryFn: () => confectioneryService.getConfectioneryById(confectioneryId),
    enabled: options?.enabled !== undefined ? options.enabled : !!confectioneryId,
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

export function useConfectioneryProductsQuery(
  confectioneryId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.products(confectioneryId),
    queryFn: () => confectioneryService.getConfectioneryProducts(confectioneryId),
    enabled: options?.enabled !== false && !!confectioneryId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useConfectioneryProductInfoQuery(
  confectioneryId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.product(confectioneryId, productId),
    queryFn: () => confectioneryService.getMenuInfo(confectioneryId, productId),
    enabled: options?.enabled !== false && !!confectioneryId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useConfectioneryPopularProductsQuery() {
  return useQuery({
    queryKey: confectioneryQueryKeys.confectioneries.popularProducts,
    queryFn: confectioneryService.getPopularMenus,
  });
}

export function usePopularProductsByConfectioneryQuery(
  confectioneryId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      confectioneryQueryKeys.confectioneries.popularProductsByConfectionery(confectioneryId),
    queryFn: () => confectioneryService.getPopularMenusByConfectionery(confectioneryId),
    enabled: options?.enabled !== false && !!confectioneryId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useConfectioneryReservedProduct = (
  confectioneryId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", confectioneryId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await confectioneryService.findReservedMenu(
        confectioneryId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!confectioneryId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
