/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface TransportTicket {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  transportTicketId: string;
  paymentInfo?: {
    paymentCurrency?: string;
    acceptedPaymentMethods?: string[];
  };
  openHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  location?: {
    coordinates: any[];
    type?: string;
  };
  rating?: number;
  image?: string;
  priceRange?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profileImage?: string;
  isFavorite?: boolean;
  badges: string[];
  [key: string]: any;
}

export interface TransportTicketMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  transportTicketId: string;
  _id?: string;
  packageName?: string;
  packageDescription?: string;
  pricing?: number;
  isAvailable?: boolean;
  packageImage?: string;
  menuId?: string;
  currency?: string;
  images?: string[];
  tags?: string;
  [key: string]: any;
}

export interface LocationFilters {
  city?: string;
  state?: string;
  country?: string;
  page?: number;
  limit?: number;
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

const apiClient = new ApiClient();

export const transportTicketService = {
  getAllTransportTickets: async (
    category: string
  ): Promise<TransportTicket[]> => {
    const response = await apiClient.get<TransportTicket[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getTransportTicketsByLocation: async (
    filters: LocationFilters
  ): Promise<TransportTicket[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=transport-tickets${queryParams.toString()}`;
    const response = await apiClient.getPublic<TransportTicket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyTransportTickets: async (params: NearbyParams): Promise<TransportTicket[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=transport-tickets${queryParams.toString()}`;
    const response = await apiClient.get<TransportTicket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getTransportTicketById: async (
    transportTicketId: string
  ): Promise<TransportTicket | null> => {
    try {
      const response = await apiClient.get<TransportTicket>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(transportTicketId)}?category=transport-tickets`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch transport ticket:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getTransportTicketProducts: async (
    transportTicketId: string
  ): Promise<TransportTicketMenu[]> => {
    try {
      const response = await apiClient.get<TransportTicketMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(transportTicketId)}?category=transport-tickets`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch transport ticket products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    transportTicketId: string,
    productId: string
  ): Promise<TransportTicketMenu | null> => {
    try {
      const response = await apiClient.get<TransportTicketMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(transportTicketId, productId)}?category=transport-tickets`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch product info:", error);
      return null;
    }
  },

  getPopularMenus: async (): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=transport-tickets`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByTransportTicket: async (transportTicketId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(transportTicketId)}?category=transport-tickets`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedTransportTickets: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<TransportTicket[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (transportTicketId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(transportTicketId, reservationCode)}?category=transport-tickets`
    );
    return response;
  },
};
