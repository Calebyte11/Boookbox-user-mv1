/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import {
  transportTicketService,
  type LocationFilters,
  type NearbyParams,
} from "@/services/transportTicketService";

export const transportTicketQueryKeys = {
  transportTickets: {
    all: ["transportTickets"] as const,
    list: (filters?: any) => ["transport-tickets", "list", filters] as const,
    detail: (id: string) => ["transport-tickets", "detail", id] as const,
    nearby: (params: any) => ["transport-tickets", "nearby", params] as const,
    byLocation: (filters: any) => ["transport-tickets", "byLocation", filters] as const,
    products: (rid: string) => ["transport-tickets", rid, "products"] as const,
    product: (rid: string, mid: string) =>
      ["transport-tickets", rid, "product", mid] as const,
    popularProducts: ["transport-tickets", "popularProducts"] as const,
    popularProductsByTransportTicket: (rid: string) =>
      ["transport-tickets", rid, "popularProducts"] as const,
    recommended: (lat: number, lng: number, category?: string, limit?: number, page?: number) =>
      ["transport-tickets", "recommended", { lat, lng, category, limit, page }] as const,
  },
};

export function useAllTransportTicketsQuery(options?: { enabled?: boolean; staleTimeMs?: number }) {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.all,
    queryFn: () => transportTicketService.getAllTransportTickets("transport-tickets"),
    enabled: options?.enabled !== false,
    staleTime: options?.staleTimeMs ?? 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function useRecommendedTransportTicketsQuery(
  lat?: number,
  lng?: number,
  category?: string,
  limit?: number,
  page?: number,
  options?: { enabled?: boolean; staleTimeMs?: number }
) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.recommended(
      hasCoords ? (lat as number) : 0,
      hasCoords ? (lng as number) : 0,
      category || undefined,
      limit || undefined,
      page || undefined
    ),
    queryFn: () =>
      transportTicketService.getRecommendedTransportTickets(
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

export function useTransportTicketsByLocationQuery(
  filters: LocationFilters,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.byLocation(filters),
    queryFn: () => transportTicketService.getTransportTicketsByLocation(filters),
    enabled: options?.enabled !== false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useNearbyTransportTicketsQuery(
  params: NearbyParams,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.nearby(params),
    queryFn: () => transportTicketService.getNearbyTransportTickets(params),
    enabled:
      options?.enabled !== false && !!params.latitude && !!params.longitude,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTransportTicketDetailQuery(
  transportTicketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.detail(transportTicketId),
    queryFn: () => transportTicketService.getTransportTicketById(transportTicketId),
    enabled: options?.enabled !== undefined ? options.enabled : !!transportTicketId,
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

export function useTransportTicketProductsQuery(
  transportTicketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.products(transportTicketId),
    queryFn: () => transportTicketService.getTransportTicketProducts(transportTicketId),
    enabled: options?.enabled !== false && !!transportTicketId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTransportTicketProductInfoQuery(
  transportTicketId: string,
  productId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.product(transportTicketId, productId),
    queryFn: () => transportTicketService.getMenuInfo(transportTicketId, productId),
    enabled: options?.enabled !== false && !!transportTicketId && !!productId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTransportTicketPopularProductsQuery() {
  return useQuery({
    queryKey: transportTicketQueryKeys.transportTickets.popularProducts,
    queryFn: transportTicketService.getPopularMenus,
  });
}

export function usePopularProductsByTransportTicketQuery(
  transportTicketId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey:
      transportTicketQueryKeys.transportTickets.popularProductsByTransportTicket(transportTicketId),
    queryFn: () => transportTicketService.getPopularMenusByTransportTicket(transportTicketId),
    enabled: options?.enabled !== false && !!transportTicketId,
    staleTime: 1000 * 60 * 5,
  });
}

export const useTransportTicketReservedProduct = (
  transportTicketId?: string,
  reservationCode?: string
) =>
  useQuery({
    queryKey: ["reservedProduct", transportTicketId ?? "", reservationCode ?? ""],
    queryFn: async () => {
      const res = await transportTicketService.findReservedMenu(
        transportTicketId ?? "",
        reservationCode ?? ""
      );
      return res && (res as any).data !== undefined ? (res as any).data : res;
    },
    enabled:
      !!transportTicketId &&
      !!reservationCode &&
      String(reservationCode).trim().length > 0,
  });
