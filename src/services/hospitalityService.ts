/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Hospitality {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  hospitalityId: string;
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

export interface HospitalityMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  hospitalityId: string;
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

export const hospitalityService = {
  getAllHospitality: async (
    category: string
  ): Promise<Hospitality[]> => {
    const response = await apiClient.get<Hospitality[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getHospitalityByLocation: async (
    filters: LocationFilters
  ): Promise<Hospitality[]> => {
    const queryParams = new URLSearchParams();
    if (filters.city) queryParams.append("city", filters.city);
    if (filters.state) queryParams.append("state", filters.state);
    if (filters.country) queryParams.append("country", filters.country);
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=hospitality${queryParams.toString()}`;
    const response = await apiClient.getPublic<Hospitality[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyHospitality: async (params: NearbyParams): Promise<Hospitality[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=hospitality${queryParams.toString()}`;
    const response = await apiClient.get<Hospitality[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getHospitalityById: async (
    hospitalityId: string
  ): Promise<Hospitality | null> => {
    try {
      const response = await apiClient.get<Hospitality>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(hospitalityId)}?category=hospitality`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch hospitality:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getHospitalityMenus: async (
    hospitalityId: string
  ): Promise<HospitalityMenu[]> => {
    try {
      const response = await apiClient.get<HospitalityMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(hospitalityId)}?category=hospitality`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch hospitality menus:", error);
      return [];
    }
  },

  getMenuInfo: async (
    hospitalityId: string,
    menuId: string
  ): Promise<HospitalityMenu | null> => {
    try {
      const response = await apiClient.get<HospitalityMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(hospitalityId, menuId)}?category=hospitality`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch menu info:", error);
      return null;
    }
  },

  getPopularMenus: async (): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=hospitality`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByHospitality: async (hospitalityId: string): Promise<any> => {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(hospitalityId)}?category=hospitality`
      );
      return response.data || [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedHospitality: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<Hospitality[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (hospitalityId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(hospitalityId, reservationCode)}?category=hospitality`
    );
    return response;
  },
};