/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  carParkingServiceService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/carParkingServiceService";
// import { nightlifeQueryKeys } from "./useNightlifeQueries";

export const carParkingQueryKeys = {
  carParkingServices: {
    all: ["carParking"] as const,
    list: (filters?: any) => ["carParking", "list", filters] as const,
    detail: (id: string) => ["carParking", "detail", id] as const,
    nearby: (params: any) => ["carParking", "nearby", params] as const,
    byLocation: (filters: any) => ["carParking", "byLocation", filters] as const,
    menus: (serviceId: string) => ["carParking", serviceId, "menus"] as const,
    menu: (serviceId: string, menuId: string) =>
      ["carParking", serviceId, "menu", menuId] as const,
    popularMenus: ["carParking", "popularMenus"] as const,
    popularMenusByCarParking: (serviceId: string) =>
      ["carParking", serviceId, "popularMenus"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["carParking", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllCarParkingServicesQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.all,
    queryFn: () => carParkingServiceService.getAllCarParkingServices("car-parking-services"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedCarParkingServicesQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      carParkingServiceService.getRecommendedCarParkingServices(
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

export function useCarParkingServicesByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.byLocation(filters),
    queryFn: () => carParkingServiceService.getCarParkingServiceByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyCarParkingServicesQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.nearby(params),
    queryFn: () => carParkingServiceService.getNearbyCarParkingServices(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCarParkingServiceDetailQuery(
  carParkingServiceId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.detail(carParkingServiceId),
    queryFn: () => carParkingServiceService.getCarParkingServiceById(carParkingServiceId),
    enabled: options?.enabled !== undefined ? options.enabled : !!carParkingServiceId,
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

export function useCarParkingServicesQuery(
  carParkingServiceId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.menus(carParkingServiceId),
    queryFn: () => carParkingServiceService.getCarParkingServiceMenus(carParkingServiceId),
    enabled: options?.enabled !== false && !!carParkingServiceId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCarParkingServiceMenuInfoQuery(
  carParkingServiceId: string,
  menuId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.menu(carParkingServiceId, menuId),
    queryFn: () => carParkingServiceService.getCarParkingServiceMenu(carParkingServiceId, menuId),
    enabled: options?.enabled !== false && !!carParkingServiceId && !!menuId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCarParkingPopularMenusQuery() {
  return useQuery({
    queryKey: carParkingQueryKeys.carParkingServices.popularMenus,
    queryFn: carParkingServiceService.getPopularMenus,
  });
}

export function usePopularMenusByCarParkingQuery(
  carParkingServiceId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      carParkingQueryKeys.carParkingServices.popularMenusByCarParking(carParkingServiceId),
    queryFn: () => carParkingServiceService.getPopularMenusByCarParkingService(carParkingServiceId),
    enabled: options?.enabled !== false && !!carParkingServiceId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useCarParkingReservedProduct = (
  carParkingServiceId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", carParkingServiceId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await carParkingServiceService.findReservedMenu(
        carParkingServiceId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!carParkingServiceId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
