/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  bakeryService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/bakeryService";

export const bakeryQueryKeys = {
  bakery: {
    all: ["bakery"] as const,
    list: (filters?: any) => ["bakery", "list", filters] as const,
    detail: (id: string) => ["bakery", "detail", id] as const,
    nearby: (params: any) => ["bakery", "nearby", params] as const,
    byLocation: (filters: any) => ["bakery", "byLocation", filters] as const,
    products: (rid: string) => ["bakery", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["bakery", rid, "product", mid] as const,
    popularProducts: ["bakery", "popularProducts"] as const,
    popularProductsByBakery: (rid: string) =>
      ["bakery", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["bakery", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllBakeryQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.all,
    queryFn: () => bakeryService.getAllBakery("bakery"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedBakeryQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      bakeryService.getRecommendedBakery(
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

export function useBakeryByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.byLocation(filters),
    queryFn: () => bakeryService.getBakeryByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyBakeryQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.nearby(params),
    queryFn: () => bakeryService.getNearbyBakery(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBakeryDetailQuery(
  bakeryId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.detail(bakeryId),
    queryFn: () => bakeryService.getBakeryById(bakeryId),
    enabled: options?.enabled !== undefined ? options.enabled : !!bakeryId,
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

export function useBakeryProductsQuery(
  bakeryId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.products(bakeryId),
    queryFn: () => bakeryService.getBakeryMenus(bakeryId),
    enabled: options?.enabled !== false && !!bakeryId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBakeryProductInfoQuery(
  bakeryId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.product(bakeryId, productId),
    queryFn: () => bakeryService.getBakeryMenu(bakeryId, productId),
    enabled: options?.enabled !== false && !!bakeryId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBakeryPopularProductsQuery() {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.popularProducts,
    queryFn: bakeryService.getPopularMenus,
  });
}

export function usePopularProductsByBakeryQuery(
  bakeryId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      bakeryQueryKeys.bakery.popularProductsByBakery(bakeryId),
    queryFn: () => bakeryService.getPopularMenusByBakery(bakeryId),
    enabled: options?.enabled !== false && !!bakeryId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useBakeryReservedProduct = (
  bakeryId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", bakeryId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await bakeryService.findReservedMenu(
        bakeryId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!bakeryId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
