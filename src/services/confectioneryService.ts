/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Confectionery {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  confectioneryId: string;
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

export interface ConfectioneryMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  confectioneryId: string;
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

export const confectioneryService = {
  getAllConfectioneries: async (
    category: string
  ): Promise<Confectionery[]> => {
    const response = await apiClient.get<Confectionery[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getConfectioneriesByLocation: async (
    filters: LocationFilters
  ): Promise<Confectionery[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=confectioneries${queryParams.toString()}`;
    const response = await apiClient.getPublic<Confectionery[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyConfectioneries: async (params: NearbyParams): Promise<Confectionery[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=confectioneries${queryParams.toString()}`;
    const response = await apiClient.get<Confectionery[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getConfectioneryById: async (
    confectioneryId: string
  ): Promise<Confectionery | null> => {
    try {
      const response = await apiClient.get<Confectionery>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(confectioneryId)}?category=confectioneries`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch confectionery:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getConfectioneryProducts: async (
    confectioneryId: string
  ): Promise<ConfectioneryMenu[]> => {
    try {
      const response = await apiClient.get<ConfectioneryMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(confectioneryId)}?category=confectioneries`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch confectionery products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    confectioneryId: string,
    productId: string
  ): Promise<ConfectioneryMenu | null> => {
    try {
      const response = await apiClient.get<ConfectioneryMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(confectioneryId, productId)}?category=confectioneries`
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
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=confectioneries`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByConfectionery: async (confectioneryId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(confectioneryId)}?category=confectioneries`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedConfectioneries: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<Confectionery[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (confectioneryId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(confectioneryId, reservationCode)}?category=confectioneries`
    );
    return response;
  },
};
