/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface FoodMarket {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  foodMarketId: string;
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

export interface FoodMarketMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  foodMarketId: string;
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

export const foodMarketService = {
  getAllFoodMarket: async (
    category: string
  ): Promise<FoodMarket[]> => {
    const response = await apiClient.get<FoodMarket[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getFoodMarketByLocation: async (
    filters: LocationFilters
  ): Promise<FoodMarket[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=food-market${queryParams.toString()}`;
    const response = await apiClient.getPublic<FoodMarket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyFoodMarket: async (params: NearbyParams): Promise<FoodMarket[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=food-market${queryParams.toString()}`;
    const response = await apiClient.get<FoodMarket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getFoodMarketById: async (
    foodMarketId: string
  ): Promise<FoodMarket | null> => {
    try {
      const response = await apiClient.get<FoodMarket>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(foodMarketId)}?category=food-market`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch food market:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getFoodMarketProducts: async (
    foodMarketId: string
  ): Promise<FoodMarketMenu[]> => {
    try {
      const response = await apiClient.get<FoodMarketMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(foodMarketId)}?category=food-market`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch food market products:", error);
      return [];
    }
  },

  getMenuInfo: async (
    foodMarketId: string,
    productId: string
  ): Promise<FoodMarketMenu | null> => {
    try {
      const response = await apiClient.get<FoodMarketMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(foodMarketId, productId)}?category=food-market`
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
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=food-market`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByFoodMarket: async (foodMarketId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(foodMarketId)}?category=food-market`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedFoodMarket: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<FoodMarket[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (foodMarketId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(foodMarketId, reservationCode)}?category=food-market`
    );
    return response;
  },
};
