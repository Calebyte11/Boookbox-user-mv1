/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  nightlifeService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/nightlifeService";

export const nightlifeQueryKeys = {
  nightlifeVenues: {
    all: ["nightlife"] as const,
    list: (filters?: any) => ["nightlife", "list", filters] as const,
    detail: (id: string) => ["nightlife", "detail", id] as const,
    nearby: (params: any) => ["nightlife", "nearby", params] as const,
    byLocation: (filters: any) => ["nightlife", "byLocation", filters] as const,
    products: (rid: string) => ["nightlife", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["nightlife", rid, "product", mid] as const,
    popularMenus: ["nightlife", "popularMenus"] as const,
    popularMenusByNightlife: (rid: string) =>
      ["nightlife", rid, "popularMenus"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["nightlife", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllNightlifeVenuesQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.all,
    queryFn: () => nightlifeService.getAllNightlifeVenues("nightlife"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedNightlifeVenuesQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      nightlifeService.getRecommendedNightlifeVenues(
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

export function useNightlifeVenuesByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.byLocation(filters),
    queryFn: () => nightlifeService.getNightlifeVenuesByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyNightlifeVenuesQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.nearby(params),
    queryFn: () => nightlifeService.getNearbyNightlifeVenues(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNightlifeVenueDetailQuery(
  nightlifeVenueId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.detail(nightlifeVenueId),
    queryFn: () => nightlifeService.getNightlifeVenueById(nightlifeVenueId),
    enabled: options?.enabled !== undefined ? options.enabled : !!nightlifeVenueId,
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

export function useNightlifeVenuesQuery(
  nightlifeVenueId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.products(nightlifeVenueId),
    queryFn: () => nightlifeService.getNightlifeVenueMenus(nightlifeVenueId),
    enabled: options?.enabled !== false && !!nightlifeVenueId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNightlifeVenueMenuInfoQuery(
  nightlifeVenueId: string,
  menuId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.product(nightlifeVenueId, menuId),
    queryFn: () => nightlifeService.getNightlifeVenueMenu(nightlifeVenueId, menuId),
    enabled: options?.enabled !== false && !!nightlifeVenueId && !!menuId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNightlifePopularMenusQuery() {
  return useQuery({
    queryKey: nightlifeQueryKeys.nightlifeVenues.popularMenus,
    queryFn: nightlifeService.getPopularMenus,
  });
}

export function usePopularMenusByNightlifeQuery(
  nightlifeVenueId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      nightlifeQueryKeys.nightlifeVenues.popularMenusByNightlife(nightlifeVenueId),
    queryFn: () => nightlifeService.getPopularMenusByNightlifeVenue(nightlifeVenueId),
    enabled: options?.enabled !== false && !!nightlifeVenueId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useNightlifeReservedProduct = (
  nightlifeVenueId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", nightlifeVenueId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await nightlifeService.findReservedMenu(
        nightlifeVenueId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!nightlifeVenueId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
