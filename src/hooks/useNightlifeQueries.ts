import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  nightlifeService,
  type NightlifeVenue,
  type NightlifeMenu,
  type LocationFilters,
  type NearbyParams,
} from "@/services/nightlifeService";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useGetAllNightlifeVenues = (): UseQueryResult<NightlifeVenue[], Error> => {
  return useQuery({
    queryKey: ["nightlifeVenues"],
    queryFn: () => nightlifeService.getAllNightlifeVenues("nightlife"),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetNightlifeVenueById = (
  nightlifeVenueId: string
): UseQueryResult<NightlifeVenue | null, Error> => {
  return useQuery({
    queryKey: ["nightlifeVenue", nightlifeVenueId],
    queryFn: () => nightlifeService.getNightlifeVenueById(nightlifeVenueId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!nightlifeVenueId,
  });
};

export const useGetNightlifeVenueMenus = (
  nightlifeVenueId: string
): UseQueryResult<NightlifeMenu[], Error> => {
  return useQuery({
    queryKey: ["nightlifeVenueMenus", nightlifeVenueId],
    queryFn: () => nightlifeService.getNightlifeVenueMenus(nightlifeVenueId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!nightlifeVenueId,
  });
};

export const useGetNightlifeVenueMenu = (
  nightlifeVenueId: string,
  menuId: string
): UseQueryResult<NightlifeMenu | null, Error> => {
  return useQuery({
    queryKey: ["nightlifeVenueMenu", nightlifeVenueId, menuId],
    queryFn: () =>
      nightlifeService.getNightlifeVenueMenu(nightlifeVenueId, menuId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!nightlifeVenueId && !!menuId,
  });
};

export const useGetNightlifeVenueByLocation = (
  filters: LocationFilters
): UseQueryResult<NightlifeVenue[], Error> => {
  return useQuery({
    queryKey: ["nightlifeVenueByLocation", filters],
    queryFn: () => nightlifeService.getNightlifeVenueByLocation(filters),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled:
      filters.latitude !== undefined &&
      filters.longitude !== undefined,
  });
};

export const useGetNearbyNightlifeVenues = (
  params: NearbyParams
): UseQueryResult<NightlifeVenue[], Error> => {
  return useQuery({
    queryKey: ["nearbyNightlifeVenues", params],
    queryFn: () => nightlifeService.getNearbyNightlifeVenues(params),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!params.latitude && !!params.longitude,
  });
};

export const useGetPopularNightlifeMenus = (): UseQueryResult<
  NightlifeMenu[],
  Error
> => {
  return useQuery({
    queryKey: ["popularNightlifeMenus"],
    queryFn: () => nightlifeService.getPopularMenus(),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetPopularNightlifeMenusByVenue = (
  nightlifeVenueId: string
): UseQueryResult<NightlifeMenu[], Error> => {
  return useQuery({
    queryKey: ["popularNightlifeMenus", nightlifeVenueId],
    queryFn: () =>
      nightlifeService.getPopularMenusByNightlifeVenue(nightlifeVenueId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!nightlifeVenueId,
  });
};

export const useGetRecommendedNightlifeVenues = (
  lat: number,
  lng: number,
  category?: string,
  limit?: number,
  page?: number
): UseQueryResult<NightlifeVenue[], Error> => {
  return useQuery({
    queryKey: ["recommendedNightlifeVenues", lat, lng, category, limit, page],
    queryFn: () =>
      nightlifeService.getRecommendedNightlifeVenues(
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
