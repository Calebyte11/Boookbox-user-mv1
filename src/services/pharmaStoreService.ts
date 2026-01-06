/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface PharmaStore {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pharmaStoreId: string;
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

export interface PharmaStoreMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  pharmaStoreId: string;
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

export const pharmaStoreService = {
  getAllPharmaStores: async (
    category: string
  ): Promise<PharmaStore[]> => {
    const response = await apiClient.get<PharmaStore[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getPharmaStoresByLocation: async (
    filters: LocationFilters
  ): Promise<PharmaStore[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=pharmacy${queryParams.toString()}`;
    const response = await apiClient.getPublic<PharmaStore[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyPharmaStores: async (params: NearbyParams): Promise<PharmaStore[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=pharmacy${queryParams.toString()}`;
    const response = await apiClient.get<PharmaStore[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getPharmaStoreById: async (
    pharmaStoreId: string
  ): Promise<PharmaStore | null> => {
    try {
      const response = await apiClient.get<PharmaStore>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(pharmaStoreId)}?category=pharmacy`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch pharma store:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getPharmaStoreProducts: async (
    pharmaStoreId: string
  ): Promise<PharmaStoreMenu[]> => {
    try {
      const response = await apiClient.get<PharmaStoreMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(pharmaStoreId)}?category=pharmacy`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch pharma store products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    pharmaStoreId: string,
    productId: string
  ): Promise<PharmaStoreMenu | null> => {
    try {
      const response = await apiClient.get<PharmaStoreMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(pharmaStoreId, productId)}?category=pharmacy`
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
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=pharmacy`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByPharmaStore: async (pharmaStoreId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(pharmaStoreId)}?category=pharmacy`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedPharmaStores: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<PharmaStore[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (pharmaStoreId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(pharmaStoreId, reservationCode)}?category=pharmacy`
    );
    return response;
  },
};
