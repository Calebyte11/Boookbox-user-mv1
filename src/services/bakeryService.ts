/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Bakery {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  bakeryId: string;
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

export interface BakeryMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  bakeryId: string;
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
  latitude?: number;
  longitude?: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface NearbyParams {
  latitude: number;
  longitude: number;
  radius?: number;
}

const apiClient = new ApiClient();

export const bakeryService = {
  getAllBakery: async (
    category: string
  ): Promise<Bakery[]> => {
    const response = await apiClient.get<Bakery[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getBakeryByLocation: async (
    filters: LocationFilters
  ): Promise<Bakery[]> => {
    const queryParams = new URLSearchParams();
    if (filters.latitude) queryParams.append("latitude", filters.latitude.toString());
    if (filters.longitude) queryParams.append("longitude", filters.longitude.toString());
    if (filters.radius) queryParams.append("radius", filters.radius.toString());
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=bakery${queryParams.toString()}`;
    const response = await apiClient.getPublic<Bakery[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyBakery: async (params: NearbyParams): Promise<Bakery[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=bakery${queryParams.toString()}`;
    const response = await apiClient.get<Bakery[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getBakeryById: async (
    bakeryId: string
  ): Promise<Bakery | null> => {
    try {
      const response = await apiClient.get<Bakery>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(bakeryId)}?category=bakery`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch bakery:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getBakeryMenus: async (
    bakeryId: string
  ): Promise<BakeryMenu[]> => {
    try {
      const response = await apiClient.get<BakeryMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(bakeryId)}?category=bakery`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch bakery menus:", error);
      return [];
    }
  },

  getBakeryMenu: async (
    bakeryId: string,
    menuId: string
  ): Promise<BakeryMenu | null> => {
    try {
      const response = await apiClient.get<BakeryMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(bakeryId, menuId)}?category=bakery`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch bakery menu:", error);
      return null;
    }
  },

  getPopularMenus: async (): Promise<BakeryMenu[]> => {
    try {
      const response = await apiClient.get<BakeryMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=bakery`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByBakery: async (bakeryId: string): Promise<BakeryMenu[]> => {
    try {
      const response = await apiClient.get<BakeryMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(bakeryId)}?category=bakery`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedBakery: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<Bakery[]> => {
    const response = await apiClient.get<Bakery[]>(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (bakeryId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(bakeryId, reservationCode)}?category=bakery`
    );
    return response;
  },
};

export default bakeryService;