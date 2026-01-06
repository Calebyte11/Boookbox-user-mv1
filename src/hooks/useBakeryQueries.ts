/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import bakeryService from "@/services/bakeryService";

export const bakeryQueryKeys = {
  bakery: {
    all: ["bakery"] as const,
    list: (filters?: any) => ["bakery", "list", filters] as const,
    detail: (id: string) => ["bakery", "detail", id] as const,
    nearby: (params: any) => ["bakery", "nearby", params] as const,
    byLocation: (filters: any) => ["bakery", "byLocation", filters] as const,
    menus: (bid: string) => ["bakery", bid, "menus"] as const,
    menu: (bid: string, mid: string) => ["bakery", bid, "menu", mid] as const,
    popularMenus: ["bakery", "popularMenus"] as const,
    popularMenusByBakery: (bid: string) =>
      ["bakery", bid, "popularMenus"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["bakery", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllBakeryQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.all,
    queryFn: () => bakeryService.getAllBakery("bakery"),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: options?.enabled !== false,
  });
}

export function useBakeryByIdQuery(
  id: string,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.detail(id),
    queryFn: () => bakeryService.getBakeryById(id),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: !!id && (options?.enabled !== false),
  });
}

export function useNearbyBakeryQuery(
  params: { latitude: number; longitude: number; radius?: number },
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.nearby(params),
    queryFn: () => bakeryService.getNearbyBakery(params),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: !!params.latitude && !!params.longitude && (options?.enabled !== false),
  });
}

export function useBakeryByLocationQuery(
  filters: {
    latitude: number;
    longitude: number;
    radius?: number;
    minPrice?: number;
    maxPrice?: number;
  },
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.byLocation(filters),
    queryFn: () => bakeryService.getBakeryByLocation(filters),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: !!filters.latitude && !!filters.longitude && (options?.enabled !== false),
  });
}

export function useBakeryMenusQuery(
  bakeryId: string,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.menus(bakeryId),
    queryFn: () => bakeryService.getBakeryMenus(bakeryId),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: !!bakeryId && (options?.enabled !== false),
  });
}

export function useBakeryMenuQuery(
  bakeryId: string,
  menuId: string,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.menu(bakeryId, menuId),
    queryFn: () => bakeryService.getBakeryMenu(bakeryId, menuId),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: !!bakeryId && !!menuId && (options?.enabled !== false),
  });
}

export function usePopularBakeryMenusQuery(
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.popularMenus,
    queryFn: () => bakeryService.getPopularMenus(),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: options?.enabled !== false,
  });
}

export function usePopularBakeryMenusByBakeryQuery(
  bakeryId: string,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.popularMenusByBakery(bakeryId),
    queryFn: () => bakeryService.getPopularMenusByBakery(bakeryId),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
    enabled: !!bakeryId && (options?.enabled !== false),
  });
}

export function useRecommendedBakeryQuery(
  latitude: number,
  longitude: number,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  return useQuery({
    queryKey: bakeryQueryKeys.bakery.recommended(latitude, longitude, undefined, limit, page),
    queryFn: () =>
      bakeryService.getRecommendedBakery(latitude, longitude, "bakery", limit ?? 10, page ?? 1),
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 2,
    enabled:
      !!latitude &&
      !!longitude &&
      (options?.enabled !== false),
  });
}