/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Restaurant {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  restaurantId: string;
  cuisineType?: string | string[];
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
  kitchenType: string | string[];
  [key: string]: any;
}

export interface RestaurantMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  restaurantId: string;
  // Legacy fields for backward compatibility
  _id?: string;
  packageName?: string;
  packageDescription?: string;
  pricing?: number;
  isAvailable?: boolean;
  packageImage?: string;
  mealType?: string;
  categoryType?: string[];
  customizations?: any[];
  menuId?: string;
  currency?: string;
  ingredients?: string[];
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

export const restaurantService = {
  getAllRestaurants: async (
    category: string
  ): Promise<Restaurant[]> => {
    const response = await apiClient.get<Restaurant[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getRestaurantsByLocation: async (
    filters: LocationFilters
  ): Promise<Restaurant[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=restaurant${queryParams.toString()}`;
    const response = await apiClient.getPublic<Restaurant[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get nearby restaurants (public endpoint)
  getNearbyRestaurants: async (params: NearbyParams): Promise<Restaurant[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=restaurant${queryParams.toString()}`;
    const response = await apiClient.get<Restaurant[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },
  // Get restaurant by ID (public endpoint)
  getRestaurantById: async (
    restaurantId: string
  ): Promise<Restaurant | null> => {
    try {
      console.log(`Fetching restaurant with ID: ${restaurantId}`);
      const endpoint = `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(restaurantId)}?category=restaurant`;
      console.log(`Endpoint: ${endpoint}`);

      const response = await apiClient.get<Restaurant>(endpoint);

      console.log(`Restaurant API response:`, response);
      console.log(`Restaurant response.data:`, response.data);
      
      if (!response.data) {
        console.error("Restaurant API returned no data:", response);
        throw new Error("No data in restaurant response");
      }
      
      return response.data;
    } catch (error) {
      console.error("Failed to fetch restaurant:", error);
      console.error("Restaurant ID:", restaurantId);
      console.error(
        "Full endpoint:",
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(restaurantId)}?category=restaurant`
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
  // Get restaurant menus
  getRestaurantMenus: async (restaurantId: string): Promise<RestaurantMenu[]> => {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(restaurantId)}?category=restaurant`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch restaurant menus:", error);
      return [];
    }
  },
  // Get specific menu item
  getMenuInfo: async (
    restaurantId: string,
    menuId: string
  ): Promise<RestaurantMenu | null> => {
    try {
      const response = await apiClient.get<any>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(restaurantId, menuId)}?category=restaurant`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch menu info:", error);
      return null;
    }
  },
  // Get popular menus (all restaurants)
  getPopularMenus: async (): Promise<any> => {
    try {
      const response = await apiClient
        .get(`${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=restaurant`)
        .then((res) => res);
      console.log("response=>", response.data);
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  // Get popular menus by restaurant
  getPopularMenusByRestaurant: async (restaurantId: string): Promise<any> => {
    try {
      const response = await apiClient
        .get(
          `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(restaurantId)}?category=restaurant`
        )
        .then((res) => res);

      return response;
    } catch (error) {
      console.error("Failed to fetch popular menus by restaurant:", error);
      return [];
    }
  },
  // Get recommended restaurants based on location
  getRecommendedRestaurants: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<Restaurant[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  // Find reserved restaurant menu
  findReservedMenu: async (restaurantId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(restaurantId, reservationCode)}?category=restaurant`
    );
    return response;
  },
};
