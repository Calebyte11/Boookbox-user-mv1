/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface WineDrinks {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  wineDrinksId: string;
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

export interface WineDrinksMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  wineDrinksId: string;
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

export const wineDrinksService = {
  getAllWineDrinks: async (
    category: string
  ): Promise<WineDrinks[]> => {
    const response = await apiClient.get<WineDrinks[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getWineDrinksByLocation: async (
    filters: LocationFilters
  ): Promise<WineDrinks[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=wine-drinks${queryParams.toString()}`;
    const response = await apiClient.getPublic<WineDrinks[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get nearby wineDrinks (public endpoint)
  getNearbyWineDrinks: async (params: NearbyParams): Promise<WineDrinks[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=wine-drinks${queryParams.toString()}`;
    const response = await apiClient.get<WineDrinks[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  }, 
  // Get WineDrinks by ID (public endpoint)
  getWineDrinksById: async (
    wineDrinksId: string
  ): Promise<WineDrinks | null> => {
    try {
      console.log(`Fetching WineDrinks with ID: ${wineDrinksId}`);
      console.log(
          `Endpoint: ${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(wineDrinksId)}?category=wine-drinks`
        );

      const response = await apiClient.get<WineDrinks>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(wineDrinksId)}?category=wine-drinks`
      );

      // console.log(`Wine & Drinks API response:`, response);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch Wine & Drinks:", error);
      console.error("Wine & Drinks ID:", wineDrinksId);
      console.error(
        "Full endpoint:",
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(wineDrinksId)}?category=wine-drinks`
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
  // Get Wine&Drinks Products
  getWineDrinksProducts: async (
    wineDrinksId: string
  ): Promise<WineDrinksMenu[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        // data: WineDrinksMenu[];
      }>(`${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(wineDrinksId)}?category=wine-drinks`);

      return response.data && Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch Wine & Drinks menus:", error);
      return [];
    }
  },
  // Get specific menu item
  getMenuInfo: async (
    wineDrinksId: string,
    menuId: string
  ): Promise<WineDrinksMenu | null> => {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(wineDrinksId, menuId)}?category=wine-drinks`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch menu info:", error);
      return null;
    }
  },
  // Get popular menus (all Wine & Drinks)
  getPopularMenus: async (): Promise<any> => {
    try {
      const response = await apiClient
        .get(`${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=wine-drinks`)
        .then((res) => res);
      console.log("response=>", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  // Get popular menus by Wine & Drinks
  getPopularMenusByWineDrinks: async (wineDrinksId: string): Promise<any> => {
    try {
      const response = await apiClient
        .get(
          `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(wineDrinksId)}?category=wine-drinks`
        )
        .then((res) => res);

      return response;
    } catch (error) {
      console.error("Failed to fetch popular menus by Wine & Drinks:", error);
      return [];
    }
  },
  // Get recommended Wine & Drinks based on location
  getRecommendedWineDrinks: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<WineDrinks[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  // Find reserved Wine & Drinks menu
  findReservedMenu: async (wineDrinksId: string, reservationCode: string):Promise<any> => {
     const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(wineDrinksId, reservationCode)}?category=wine-drinks`
      );
    return response;
  },

  
};
