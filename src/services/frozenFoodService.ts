/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface FrozenFoods {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  frozenFoodsId: string;
//   cuisineType?: string | string[];
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
    coordinates: any[]; // [longitude, latitude]
    type?: string; // "Point"
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
//   kitchenType: string | string[];
  [key: string]: any;
}

export interface FrozenFoodsMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  frozenFoodsId: string;
  // Legacy fields for backward compatibility
  _id?: string;
  packageName?: string;
  packageDescription?: string;
  pricing?: number;
  isAvailable?: boolean;
  packageImage?: string;
//   mealType?: string;
//   categoryType?: string[];
//   customizations?: any[];
  menuId?: string;
  currency?: string;
//   ingredients?: string[];
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

export const frozenFoodsService = {
  getAllFrozenFoods: async (
    category: string
  ): Promise<FrozenFoods[]> => {
    const response = await apiClient.get<FrozenFoods[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getFrozenFoodsByLocation: async (
    filters: LocationFilters
  ): Promise<FrozenFoods[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=frozen-foods?${queryParams.toString()}`;
    const response = await apiClient.getPublic<FrozenFoods[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get nearby frozenFoods (public endpoint)
  getNearbyFrozenFoods: async (params: NearbyParams): Promise<FrozenFoods[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=frozen-foods?${queryParams.toString()}`;
    const response = await apiClient.get<FrozenFoods[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  }, 
  // Get FrozenFoods by ID (public endpoint)
  getFrozenFoodsById: async (
    frozenFoodsId: string
  ): Promise<FrozenFoods | null> => {
    try {
      console.log(`Fetching FrozenFoods with ID: ${frozenFoodsId}`);
      console.log(
        `Endpoint: ${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(frozenFoodsId)}?category=frozen-foods`
      );

      const response = await apiClient.get<FrozenFoods>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(frozenFoodsId)}?category=frozen-foods`
      );

      // console.log(`FrozenFoods API response:`, response);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch FrozenFoods:", error);
      console.error("FrozenFoods ID:", frozenFoodsId);
      console.error(
        "Full endpoint:",
        `Endpoint: ${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(frozenFoodsId)}?category=frozen-foods`
      );

      // Re-throw 404 errors so they can be handled by React Query
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },
  // Get FrozenFoods Products
  getFrozenFoodsProducts: async (
    frozenFoodsId: string
  ): Promise<FrozenFoodsMenu[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        // data: FrozenFoodsMenu[];
      }>(`${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(frozenFoodsId)}?category=frozen-foods`);

      return response.data && Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch FrozenFoods menus:", error);
      return [];
    }
  },
  // Get specific menu item
  getMenuInfo: async (
    frozenFoodsId: string,
    productId: string
  ): Promise<FrozenFoodsMenu | null> => {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(frozenFoodsId, productId)}?category=frozen-foods`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch menu info:", error);
      return null;
    }
  },
  // Get popular menus (all FrozenFoods)
  getPopularMenus: async (): Promise<any> => {
    try {
      const response = await apiClient
        .get(`${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=frozen-foods`)
        .then((res) => res);
      console.log("response=>", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  // Get popular menus by FrozenFoods
  getPopularMenusByFrozenFoods: async (frozenFoodsId: string): Promise<any> => {
    try {
      const response = await apiClient
        .get(
          `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(frozenFoodsId)}?category=frozen-foods`
        )
        .then((res) => res);

      return response;
    } catch (error) {
      console.error("Failed to fetch popular menus by FrozenFoods:", error);
      return [];
    }
  },
  // Get recommended FrozenFoods based on location
  getRecommendedFrozenFoods: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<FrozenFoods[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  // Find reserved FrozenFoods menu
  findReservedMenu: async (frozenFoodsId: string, reservationCode: string):Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(frozenFoodsId, reservationCode)}?category=frozen-foods`
    );
    
    return response;
  },

  
};
