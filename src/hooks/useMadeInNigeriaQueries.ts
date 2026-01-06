/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  madeInNigeriaService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/madeInNigeriaService";

export const madeInNigeriaQueryKeys = {
  madeInNigeria: {
    all: ["madeInNigeria"] as const,
    list: (filters?: any) => ["made-in-nigeria", "list", filters] as const,
    detail: (id: string) => ["made-in-nigeria", "detail", id] as const,
    nearby: (params: any) => ["made-in-nigeria", "nearby", params] as const,
    byLocation: (filters: any) => ["made-in-nigeria", "byLocation", filters] as const,
    products: (rid: string) => ["made-in-nigeria", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["made-in-nigeria", rid, "product", mid] as const,
    popularProducts: ["made-in-nigeria", "popularProducts"] as const,
    popularProductsByMadeInNigeria: (rid: string) =>
      ["made-in-nigeria", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["made-in-nigeria", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllMadeInNigeriaQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.all,
    queryFn: () => madeInNigeriaService.getAllMadeInNigeria("made-in-nigeria"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedMadeInNigeriaQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      madeInNigeriaService.getRecommendedMadeInNigeria(
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

export function useMadeInNigeriaByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.byLocation(filters),
    queryFn: () => madeInNigeriaService.getMadeInNigeriaByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyMadeInNigeriaQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.nearby(params),
    queryFn: () => madeInNigeriaService.getNearbyMadeInNigeria(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMadeInNigeriaDetailQuery(
  madeInNigeriaId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.detail(madeInNigeriaId),
    queryFn: () => madeInNigeriaService.getMadeInNigeriaById(madeInNigeriaId),
    enabled: options?.enabled !== undefined ? options.enabled : !!madeInNigeriaId,
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

export function useMadeInNigeriaProductsQuery(
  madeInNigeriaId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.products(madeInNigeriaId),
    queryFn: () => madeInNigeriaService.getMadeInNigeriaProducts(madeInNigeriaId),
    enabled: options?.enabled !== false && !!madeInNigeriaId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMadeInNigeriaProductInfoQuery(
  madeInNigeriaId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.product(madeInNigeriaId, productId),
    queryFn: () => madeInNigeriaService.getMenuInfo(madeInNigeriaId, productId),
    enabled: options?.enabled !== false && !!madeInNigeriaId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMadeInNigeriaPopularProductsQuery() {
  return useQuery({
    queryKey: madeInNigeriaQueryKeys.madeInNigeria.popularProducts,
    queryFn: madeInNigeriaService.getPopularMenus,
  });
}

export function usePopularProductsByMadeInNigeriaQuery(
  madeInNigeriaId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      madeInNigeriaQueryKeys.madeInNigeria.popularProductsByMadeInNigeria(madeInNigeriaId),
    queryFn: () => madeInNigeriaService.getPopularMenusByMadeInNigeria(madeInNigeriaId),
    enabled: options?.enabled !== false && !!madeInNigeriaId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useMadeInNigeriaReservedProduct = (
  madeInNigeriaId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", madeInNigeriaId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await madeInNigeriaService.findReservedMenu(
        madeInNigeriaId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!madeInNigeriaId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
