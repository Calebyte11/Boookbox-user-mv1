/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface MadeInNigeria {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  madeInNigeriaId: string;
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

export interface MadeInNigeriaMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  madeInNigeriaId: string;
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

export const madeInNigeriaService = {
  getAllMadeInNigeria: async (
    category: string
  ): Promise<MadeInNigeria[]> => {
    const response = await apiClient.get<MadeInNigeria[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getMadeInNigeriaByLocation: async (
    filters: LocationFilters
  ): Promise<MadeInNigeria[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=made-in-nigeria${queryParams.toString()}`;
    const response = await apiClient.getPublic<MadeInNigeria[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyMadeInNigeria: async (params: NearbyParams): Promise<MadeInNigeria[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=made-in-nigeria${queryParams.toString()}`;
    const response = await apiClient.get<MadeInNigeria[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getMadeInNigeriaById: async (
    madeInNigeriaId: string
  ): Promise<MadeInNigeria | null> => {
    try {
      const response = await apiClient.get<MadeInNigeria>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(madeInNigeriaId)}?category=made-in-nigeria`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch made in nigeria:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getMadeInNigeriaProducts: async (
    madeInNigeriaId: string
  ): Promise<MadeInNigeriaMenu[]> => {
    try {
      const response = await apiClient.get<MadeInNigeriaMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(madeInNigeriaId)}?category=made-in-nigeria`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch made in nigeria products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    madeInNigeriaId: string,
    productId: string
  ): Promise<MadeInNigeriaMenu | null> => {
    try {
      const response = await apiClient.get<MadeInNigeriaMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(madeInNigeriaId, productId)}?category=made-in-nigeria`
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
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=made-in-nigeria`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByMadeInNigeria: async (madeInNigeriaId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(madeInNigeriaId)}?category=made-in-nigeria`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedMadeInNigeria: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<MadeInNigeria[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (madeInNigeriaId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(madeInNigeriaId, reservationCode)}?category=made-in-nigeria`
    );
    return response;
  },
};
