/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface NightlifeVenue {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  nightlifeVenueId: string;
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

export interface NightlifeMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  nightlifeVenueId: string;
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

export const nightlifeService = {
  getAllNightlifeVenues: async (category: string): Promise<NightlifeVenue[]> => {
    const response = await apiClient.get<NightlifeVenue[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getNightlifeVenueByLocation: async (
    filters: LocationFilters
  ): Promise<NightlifeVenue[]> => {
    const queryParams = new URLSearchParams();
    if (filters.latitude) queryParams.append("latitude", filters.latitude.toString());
    if (filters.longitude) queryParams.append("longitude", filters.longitude.toString());
    if (filters.radius) queryParams.append("radius", filters.radius.toString());
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=nightlife${queryParams.toString()}`;
    const response = await apiClient.getPublic<NightlifeVenue[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyNightlifeVenues: async (params: NearbyParams): Promise<NightlifeVenue[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=nightlife${queryParams.toString()}`;
    const response = await apiClient.get<NightlifeVenue[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNightlifeVenueById: async (
    nightlifeVenueId: string
  ): Promise<NightlifeVenue | null> => {
    try {
      const response = await apiClient.get<NightlifeVenue>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(nightlifeVenueId)}?category=nightlife`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch nightlife venue:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getNightlifeVenueMenus: async (
    nightlifeVenueId: string
  ): Promise<NightlifeMenu[]> => {
    try {
      const response = await apiClient.get<NightlifeMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(nightlifeVenueId)}?category=nightlife`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch nightlife venue menus:", error);
      return [];
    }
  },

  getNightlifeVenueMenu: async (
    nightlifeVenueId: string,
    menuId: string
  ): Promise<NightlifeMenu | null> => {
    try {
      const response = await apiClient.get<NightlifeMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(nightlifeVenueId, menuId)}?category=nightlife`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch nightlife venue menu:", error);
      return null;
    }
  },

  getPopularMenus: async (): Promise<NightlifeMenu[]> => {
    try {
      const response = await apiClient.get<NightlifeMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=nightlife`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByNightlifeVenue: async (nightlifeVenueId: string): Promise<NightlifeMenu[]> => {
    try {
      const response = await apiClient.get<NightlifeMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(nightlifeVenueId)}?category=nightlife`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedNightlifeVenues: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<NightlifeVenue[]> => {
    const response = await apiClient.get<NightlifeVenue[]>(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (nightlifeVenueId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(nightlifeVenueId, reservationCode)}?category=nightlife`
    );
    return response;
  },
};

export default nightlifeService;
