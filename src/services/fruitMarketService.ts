/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface FruitMarket {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  fruitMarketId: string;
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

export interface FruitMarketMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  fruitMarketId: string;
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

export const fruitMarketService = {
  getAllFruitMarket: async (
    category: string
  ): Promise<FruitMarket[]> => {
    const response = await apiClient.get<FruitMarket[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getFruitMarketByLocation: async (
    filters: LocationFilters
  ): Promise<FruitMarket[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=fruit-market${queryParams.toString()}`;
    const response = await apiClient.getPublic<FruitMarket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyFruitMarket: async (params: NearbyParams): Promise<FruitMarket[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=fruit-market${queryParams.toString()}`;
    const response = await apiClient.get<FruitMarket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getFruitMarketById: async (
    fruitMarketId: string
  ): Promise<FruitMarket | null> => {
    try {
      const response = await apiClient.get<FruitMarket>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(fruitMarketId)}?category=fruit-market`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch fruit market:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getFruitMarketProducts: async (
    fruitMarketId: string
  ): Promise<FruitMarketMenu[]> => {
    try {
      const response = await apiClient.get<FruitMarketMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(fruitMarketId)}?category=fruit-market`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch fruit market products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    fruitMarketId: string,
    productId: string
  ): Promise<FruitMarketMenu | null> => {
    try {
      const response = await apiClient.get<FruitMarketMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(fruitMarketId, productId)}?category=fruit-market`
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
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=fruit-market`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByFruitMarket: async (fruitMarketId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(fruitMarketId)}?category=fruit-market`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedFruitMarket: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<FruitMarket[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (fruitMarketId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(fruitMarketId, reservationCode)}?category=fruit-market`
    );
    return response;
  },
};
