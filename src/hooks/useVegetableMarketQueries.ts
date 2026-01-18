import { useQuery } from "@tanstack/react-query";
import type { UseQueryResult } from "@tanstack/react-query";
import {
  vegetableMarketService,
  type VegetableMarket,
  type VegetableMarketProduct,
  type LocationFilters,
  type NearbyParams,
} from "@/services/vegetableMarketService";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useGetAllVegetableMarkets = (): UseQueryResult<VegetableMarket[], Error> => {
  return useQuery({
    queryKey: ["vegetableMarkets"],
    queryFn: () => vegetableMarketService.getAllVegetableMarkets("vegetable-market"),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetVegetableMarketById = (
  vegetableMarketId: string
): UseQueryResult<VegetableMarket | null, Error> => {
  return useQuery({
    queryKey: ["vegetableMarket", vegetableMarketId],
    queryFn: () => vegetableMarketService.getVegetableMarketById(vegetableMarketId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!vegetableMarketId,
  });
};

export const useGetVegetableMarketProducts = (
  vegetableMarketId: string
): UseQueryResult<VegetableMarketProduct[], Error> => {
  return useQuery({
    queryKey: ["vegetableMarketProducts", vegetableMarketId],
    queryFn: () => vegetableMarketService.getVegetableMarketProducts(vegetableMarketId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!vegetableMarketId,
  });
};

export const useGetVegetableMarketProduct = (
  vegetableMarketId: string,
  productId: string
): UseQueryResult<VegetableMarketProduct | null, Error> => {
  return useQuery({
    queryKey: ["vegetableMarketProduct", vegetableMarketId, productId],
    queryFn: () =>
      vegetableMarketService.getVegetableMarketProduct(vegetableMarketId, productId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!vegetableMarketId && !!productId,
  });
};

export const useGetVegetableMarketByLocation = (
  filters: LocationFilters
): UseQueryResult<VegetableMarket[], Error> => {
  return useQuery({
    queryKey: ["vegetableMarketByLocation", filters],
    queryFn: () => vegetableMarketService.getVegetableMarketByLocation(filters),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled:
      filters.latitude !== undefined &&
      filters.longitude !== undefined,
  });
};

export const useGetNearbyVegetableMarkets = (
  params: NearbyParams
): UseQueryResult<VegetableMarket[], Error> => {
  return useQuery({
    queryKey: ["nearbyVegetableMarkets", params],
    queryFn: () => vegetableMarketService.getNearbyVegetableMarkets(params),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!params.latitude && !!params.longitude,
  });
};

export const useGetPopularVegetableMarketProducts = (): UseQueryResult<
  VegetableMarketProduct[],
  Error
> => {
  return useQuery({
    queryKey: ["popularVegetableMarketProducts"],
    queryFn: () => vegetableMarketService.getPopularProducts(),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useGetPopularVegetableMarketProductsByMarket = (
  vegetableMarketId: string
): UseQueryResult<VegetableMarketProduct[], Error> => {
  return useQuery({
    queryKey: ["popularVegetableMarketProducts", vegetableMarketId],
    queryFn: () =>
      vegetableMarketService.getPopularProductsByMarket(vegetableMarketId),
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: !!vegetableMarketId,
  });
};

export const useGetRecommendedVegetableMarkets = (
  lat: number,
  lng: number,
  category?: string,
  limit?: number,
  page?: number
): UseQueryResult<VegetableMarket[], Error> => {
  return useQuery({
    queryKey: ["recommendedVegetableMarkets", lat, lng, category, limit, page],
    queryFn: () =>
      vegetableMarketService.getRecommendedVegetableMarkets(
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
