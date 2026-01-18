import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  carParkingServiceService,
  type CarParkingService,
  type CarParkingServiceMenu,
  type LocationFilters,
  type NearbyParams,
} from "@/services/carParkingServiceService";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useGetAllCarParkingServices = (): UseQueryResult<CarParkingService[], Error> => {
  return useQuery({
    queryKey: ["carParkingServices"],
    queryFn: () => carParkingServiceService.getAllCarParkingServices("car-parking-services"),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetCarParkingServiceById = (
  carParkingServiceId: string
): UseQueryResult<CarParkingService | null, Error> => {
  return useQuery({
    queryKey: ["carParkingService", carParkingServiceId],
    queryFn: () => carParkingServiceService.getCarParkingServiceById(carParkingServiceId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!carParkingServiceId,
  });
};

export const useGetCarParkingServiceMenus = (
  carParkingServiceId: string
): UseQueryResult<CarParkingServiceMenu[], Error> => {
  return useQuery({
    queryKey: ["carParkingServiceMenus", carParkingServiceId],
    queryFn: () => carParkingServiceService.getCarParkingServiceMenus(carParkingServiceId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!carParkingServiceId,
  });
};

export const useGetCarParkingServiceMenu = (
  carParkingServiceId: string,
  menuId: string
): UseQueryResult<CarParkingServiceMenu | null, Error> => {
  return useQuery({
    queryKey: ["carParkingServiceMenu", carParkingServiceId, menuId],
    queryFn: () =>
      carParkingServiceService.getCarParkingServiceMenu(carParkingServiceId, menuId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!carParkingServiceId && !!menuId,
  });
};

export const useGetCarParkingServiceByLocation = (
  filters: LocationFilters
): UseQueryResult<CarParkingService[], Error> => {
  return useQuery({
    queryKey: ["carParkingServiceByLocation", filters],
    queryFn: () => carParkingServiceService.getCarParkingServiceByLocation(filters),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled:
      filters.latitude !== undefined &&
      filters.longitude !== undefined,
  });
};

export const useGetNearbyCarParkingServices = (
  params: NearbyParams
): UseQueryResult<CarParkingService[], Error> => {
  return useQuery({
    queryKey: ["nearbyCarParkingServices", params],
    queryFn: () => carParkingServiceService.getNearbyCarParkingServices(params),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!params.latitude && !!params.longitude,
  });
};

export const useGetPopularCarParkingMenus = (): UseQueryResult<
  CarParkingServiceMenu[],
  Error
> => {
  return useQuery({
    queryKey: ["popularCarParkingMenus"],
    queryFn: () => carParkingServiceService.getPopularMenus(),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetPopularCarParkingMenusByService = (
  carParkingServiceId: string
): UseQueryResult<CarParkingServiceMenu[], Error> => {
  return useQuery({
    queryKey: ["popularCarParkingMenus", carParkingServiceId],
    queryFn: () =>
      carParkingServiceService.getPopularMenusByCarParkingService(carParkingServiceId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!carParkingServiceId,
  });
};

export const useGetRecommendedCarParkingServices = (
  lat: number,
  lng: number,
  category?: string,
  limit?: number,
  page?: number
): UseQueryResult<CarParkingService[], Error> => {
  return useQuery({
    queryKey: ["recommendedCarParkingServices", lat, lng, category, limit, page],
    queryFn: () =>
      carParkingServiceService.getRecommendedCarParkingServices(
        lat,
        lng,
        category,
        limit,
        page
      ),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!lat && !!lng,
  });
};
