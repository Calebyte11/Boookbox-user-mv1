/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Groceries {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  groceriesId: string;
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

export interface GroceriesMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  groceriesId: string;
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

export const groceriesService = {
  getAllGroceries: async (
    category: string
  ): Promise<Groceries[]> => {
    const response = await apiClient.get<Groceries[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getGroceriesByLocation: async (
    filters: LocationFilters
  ): Promise<Groceries[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=groceries${queryParams.toString()}`;
    const response = await apiClient.getPublic<Groceries[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get nearby restaurants (public endpoint)
  getNearbyGroceries: async (params: NearbyParams): Promise<Groceries[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=groceries${queryParams.toString()}`;
    const response = await apiClient.get<Groceries[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  }, 
  // Get Groceries by ID (public endpoint)
  getGroceriesById: async (
    groceriesId: string
  ): Promise<Groceries | null> => {
    try {
      console.log(`Fetching groceries with ID: ${groceriesId}`);
        console.log(
          `Endpoint: ${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(groceriesId)}?category=groceries`
        );

      const response = await apiClient.get<Groceries>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(groceriesId)}?category=groceries`
      );

      // console.log(`Groceries API response:`, response);
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch groceries:", error);
      console.error("Groceries ID:", groceriesId);
      console.error(
        "Full endpoint:",
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(groceriesId)}?category=groceries`
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
  // Get groceries Product
  getGroceriesProducts: async (
    groceriesId: string
  ): Promise<GroceriesMenu[]> => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        message: string;
        // data: GroceriesMenu[];
      }>(`${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(groceriesId)}?category=groceries`);
      
      return response.data && Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch groceries menus:", error);
      return [];
    }
  },
  // Get specific menu item
  getMenuInfo: async (
    groceriesId: string,
    menuId: string
  ): Promise<GroceriesMenu | null> => {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(groceriesId, menuId)}?category=groceries`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch menu info:", error);
      return null;
    }
  },
  // Get popular menus (all groceries)
  getPopularMenus: async (): Promise<any> => {
    try {
      const response = await apiClient
        .get(`${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=groceries`)
        .then((res) => res);
      console.log("response=>", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular products:", error);
      return [];
    }
  },

  // Get popular menus by Groceries
  getPopularMenusByGroceries: async (groceriesId: string): Promise<any> => {
    try {
      const response = await apiClient
        .get(
          `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(groceriesId)}?category=groceries`
        )
        .then((res) => res);

      return response;
    } catch (error) {
      console.error("Failed to fetch popular menus by groceries:", error);
      return [];
    }
  },
  // Get recommended groceries based on location
  getRecommendedGroceries: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<Groceries[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  // Find reserved groceries menu
  findReservedMenu: async (groceriesId: string, reservationCode: string):Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(groceriesId, reservationCode)}?category=groceries`
    );
    return response;
  },

  
};
