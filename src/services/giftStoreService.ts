/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface GiftStore {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  giftStoreId: string;
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

export interface GiftStoreMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  giftStoreId: string;
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

export const giftStoreService = {
  getAllGiftStores: async (
    category: string
  ): Promise<GiftStore[]> => {
    const response = await apiClient.get<GiftStore[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getGiftStoresByLocation: async (
    filters: LocationFilters
  ): Promise<GiftStore[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=gift-stores${queryParams.toString()}`;
    const response = await apiClient.getPublic<GiftStore[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyGiftStores: async (params: NearbyParams): Promise<GiftStore[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=gift-stores${queryParams.toString()}`;
    const response = await apiClient.get<GiftStore[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getGiftStoreById: async (
    giftStoreId: string
  ): Promise<GiftStore | null> => {
    try {
      const response = await apiClient.get<GiftStore>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(giftStoreId)}?category=gift-stores`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch gift store:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getGiftStoreProducts: async (
    giftStoreId: string
  ): Promise<GiftStoreMenu[]> => {
    try {
      const response = await apiClient.get<GiftStoreMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(giftStoreId)}?category=gift-stores`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch gift store products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    giftStoreId: string,
    productId: string
  ): Promise<GiftStoreMenu | null> => {
    try {
      const response = await apiClient.get<GiftStoreMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(giftStoreId, productId)}?category=gift-stores`
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
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=gift-stores`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByGiftStore: async (giftStoreId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(giftStoreId)}?category=gift-stores`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedGiftStores: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<GiftStore[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (giftStoreId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(giftStoreId, reservationCode)}?category=gift-stores`
    );
    return response;
  },
};
