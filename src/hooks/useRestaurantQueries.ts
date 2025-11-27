/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  restaurantService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/restaurantService";

// Query key definitions
export const restaurantQueryKeys = {
  restaurants: {
    all: ["restaurants"] as const,
    list: (filters?: any) => ["restaurants", "list", filters] as const,
    detail: (id: string) => ["restaurants", "detail", id] as const,
    nearby: (params: any) => ["restaurants", "nearby", params] as const,
    byLocation: (filters: any) =>
      ["restaurants", "byLocation", filters] as const,
    menus: (rid: string) => ["restaurants", rid, "menus"] as const,
    menu: (rid: string, mid: string) =>
      ["restaurants", rid, "menu", mid] as const,
    popularMenus: ["restaurants", "popularMenus"] as const,
    popularMenusByRestaurant: (rid: string) =>
      ["restaurants", rid, "popularMenus"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["restaurants", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

// Get all restaurants
export function useAllRestaurantsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.all,
    queryFn: () => restaurantService.getAllRestaurants("restaurants"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10, // 10 minutes default
    gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
    retry: 2,
    refetchOnWindowFocus: false,
  });
}


// Get recommended restaurants
export function useRecommendedRestaurantsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.recommended(
      // Use 0 as stable placeholder in key when coords are missing
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    // Only call API when coords exist
    queryFn: () =>
      restaurantService.getRecommendedRestaurants(
        lat as number,
        lng as number,
        category as string,
        limit,
        page,
      ),
    enabled: options?.enabled ?? hasCoords,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 5,
  });
}

// Get restaurants by location
export function useRestaurantsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.byLocation(filters),
    queryFn: () => restaurantService.getRestaurantsByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get nearby restaurants
export function useNearbyRestaurantsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.nearby(params),
    queryFn: () => restaurantService.getNearbyRestaurants(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRestaurantDetailQuery(
  restaurantId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.detail(restaurantId),
    queryFn: () => restaurantService.getRestaurantById(restaurantId),
    enabled: options?.enabled !== undefined ? options.enabled : !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (restaurant not found)
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        return false;
      }
      // Don't retry on auth errors
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

// Get restaurant menus
export function useRestaurantMenusQuery(
  restaurantId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.menus(restaurantId),
    queryFn: () => restaurantService.getRestaurantMenus(restaurantId),
    enabled: options?.enabled !== false && !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get specific menu item
export function useRestaurantMenuInfoQuery(
  restaurantId: string,
  menuId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.menu(restaurantId, menuId),
    queryFn: () => restaurantService.getMenuInfo(restaurantId, menuId),
    enabled: options?.enabled !== false && !!restaurantId && !!menuId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Get popular menus
export function useRestaurantPopularMenusQuery() {
  return useQuery({
    queryKey: restaurantQueryKeys.restaurants.popularMenus,
    queryFn: restaurantService.getPopularMenus,
  });
}

// Get popular menus by restaurant
export function usePopularMenusByRestaurantQuery(
  restaurantId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      restaurantQueryKeys.restaurants.popularMenusByRestaurant(restaurantId),
    queryFn: () => restaurantService.getPopularMenusByRestaurant(restaurantId),
    enabled: options?.enabled !== false && !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// FIND RESERVED RESTAURANT MENU
export const useRestaurantReservedMenu = (
  restaurantId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedMenu", restaurantId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      // Call service and prefer the actual payload (response.data) when present
      const res = await restaurantService.findReservedMenu(
        restaurantId ?? "",
        reservationCode ?? ""
      );
      // If API client returned an object with `data`, return that; otherwise return the raw response
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    // Only enable when we have a valid restaurantId and a non-empty reservationCode
    enabled:
      !!restaurantId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
