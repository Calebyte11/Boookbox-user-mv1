/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  hangoutTicketService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/hangoutTicketService";

export const hangoutTicketQueryKeys = {
  hangoutTickets: {
    all: ["hangoutTickets"] as const,
    list: (filters?: any) => ["hangout-tickets", "list", filters] as const,
    detail: (id: string) => ["hangout-tickets", "detail", id] as const,
    nearby: (params: any) => ["hangout-tickets", "nearby", params] as const,
    byLocation: (filters: any) => ["hangout-tickets", "byLocation", filters] as const,
    products: (rid: string) => ["hangout-tickets", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["hangout-tickets", rid, "product", mid] as const,
    popularProducts: ["hangout-tickets", "popularProducts"] as const,
    popularProductsByHangoutTicket: (rid: string) =>
      ["hangout-tickets", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["hangout-tickets", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllHangoutTicketsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.all,
    queryFn: () => hangoutTicketService.getAllHangoutTickets("hangout-tickets"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedHangoutTicketsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      hangoutTicketService.getRecommendedHangoutTickets(
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

export function useHangoutTicketsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.byLocation(filters),
    queryFn: () => hangoutTicketService.getHangoutTicketsByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyHangoutTicketsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.nearby(params),
    queryFn: () => hangoutTicketService.getNearbyHangoutTickets(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHangoutTicketDetailQuery(
  hangoutTicketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.detail(hangoutTicketId),
    queryFn: () => hangoutTicketService.getHangoutTicketById(hangoutTicketId),
    enabled: options?.enabled !== undefined ? options.enabled : !!hangoutTicketId,
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

export function useHangoutTicketProductsQuery(
  hangoutTicketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.products(hangoutTicketId),
    queryFn: () => hangoutTicketService.getHangoutTicketProducts(hangoutTicketId),
    enabled: options?.enabled !== false && !!hangoutTicketId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHangoutTicketProductInfoQuery(
  hangoutTicketId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.product(hangoutTicketId, productId),
    queryFn: () => hangoutTicketService.getMenuInfo(hangoutTicketId, productId),
    enabled: options?.enabled !== false && !!hangoutTicketId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useHangoutTicketPopularProductsQuery() {
  return useQuery({
    queryKey: hangoutTicketQueryKeys.hangoutTickets.popularProducts,
    queryFn: hangoutTicketService.getPopularMenus,
  });
}

export function usePopularProductsByHangoutTicketQuery(
  hangoutTicketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      hangoutTicketQueryKeys.hangoutTickets.popularProductsByHangoutTicket(hangoutTicketId),
    queryFn: () => hangoutTicketService.getPopularMenusByHangoutTicket(hangoutTicketId),
    enabled: options?.enabled !== false && !!hangoutTicketId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useHangoutTicketReservedProduct = (
  hangoutTicketId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", hangoutTicketId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await hangoutTicketService.findReservedMenu(
        hangoutTicketId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!hangoutTicketId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
