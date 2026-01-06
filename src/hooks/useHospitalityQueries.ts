/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  hospitalityService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/hospitalityService";

export const hospitalityQueryKeys = {
  hospitalities: {
    all: ["hospitalities"] as const,
    list: (filters?: any) => ["hospitality", "list", filters] as const,
    detail: (id: string) => ["hospitality", "detail", id] as const,
    nearby: (params: any) => ["hospitality", "nearby", params] as const,
    byLocation: (filters: any) => ["hospitality", "byLocation", filters] as const,
    menus: (hid: string) => ["hospitality", hid, "menus"] as const,
    menu: (hid: string, mid: string) =>
      ["hospitality", hid, "menu", mid] as const,
    popularMenus: ["hospitality", "popularMenus"] as const,
    popularMenusByHospitality: (hid: string) =>
      ["hospitality", hid, "popularMenus"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["hospitality", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllHospitalityQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.all,
    queryFn: () => hospitalityService.getAllHospitality("hospitality"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedHospitalityQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      hospitalityService.getRecommendedHospitality(
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

export function useHospitalityByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.byLocation(filters),
    queryFn: () => hospitalityService.getHospitalityByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyHospitalityQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.nearby(params),
    queryFn: () => hospitalityService.getNearbyHospitality(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHospitalityDetailQuery(
  hospitalityId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.detail(hospitalityId),
    queryFn: () => hospitalityService.getHospitalityById(hospitalityId),
    enabled: options?.enabled !== undefined ? options.enabled : !!hospitalityId,
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

export function useHospitalityMenusQuery(
  hospitalityId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.menus(hospitalityId),
    queryFn: () => hospitalityService.getHospitalityMenus(hospitalityId),
    enabled: options?.enabled !== false && !!hospitalityId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHospitalityMenuInfoQuery(
  hospitalityId: string,
  menuId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.menu(hospitalityId, menuId),
    queryFn: () => hospitalityService.getMenuInfo(hospitalityId, menuId),
    enabled: options?.enabled !== false && !!hospitalityId && !!menuId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHospitalityPopularMenusQuery() {
  return useQuery({
    queryKey: hospitalityQueryKeys.hospitalities.popularMenus,
    queryFn: hospitalityService.getPopularMenus,
  });
}

export function usePopularMenusByHospitalityQuery(
  hospitalityId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      hospitalityQueryKeys.hospitalities.popularMenusByHospitality(hospitalityId),
    queryFn: () => hospitalityService.getPopularMenusByHospitality(hospitalityId),
    enabled: options?.enabled !== false && !!hospitalityId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useHospitalityReservedMenu = (
  hospitalityId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedMenu", hospitalityId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await hospitalityService.findReservedMenu(
        hospitalityId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!hospitalityId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
