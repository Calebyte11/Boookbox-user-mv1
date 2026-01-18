/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface CarParkingService {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  carParkingServiceId: string;
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

export interface CarParkingServiceMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  carParkingServiceId: string;
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

export const carParkingServiceService = {
  getAllCarParkingServices: async (
    category: string
  ): Promise<CarParkingService[]> => {
    const response = await apiClient.get<CarParkingService[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getCarParkingServiceByLocation: async (
    filters: LocationFilters
  ): Promise<CarParkingService[]> => {
    const queryParams = new URLSearchParams();
    if (filters.latitude) queryParams.append("latitude", filters.latitude.toString());
    if (filters.longitude) queryParams.append("longitude", filters.longitude.toString());
    if (filters.radius) queryParams.append("radius", filters.radius.toString());
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=car-parking-services${queryParams.toString()}`;
    const response = await apiClient.getPublic<CarParkingService[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyCarParkingServices: async (params: NearbyParams): Promise<CarParkingService[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=car-parking-services${queryParams.toString()}`;
    const response = await apiClient.get<CarParkingService[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getCarParkingServiceById: async (
    carParkingServiceId: string
  ): Promise<CarParkingService | null> => {
    try {
      const response = await apiClient.get<CarParkingService>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(carParkingServiceId)}?category=car-parking-services`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch car parking service:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getCarParkingServiceMenus: async (
    carParkingServiceId: string
  ): Promise<CarParkingServiceMenu[]> => {
    try {
      const response = await apiClient.get<CarParkingServiceMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(carParkingServiceId)}?category=car-parking-services`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch car parking service menus:", error);
      return [];
    }
  },

  getCarParkingServiceMenu: async (
    carParkingServiceId: string,
    menuId: string
  ): Promise<CarParkingServiceMenu | null> => {
    try {
      const response = await apiClient.get<CarParkingServiceMenu>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(carParkingServiceId, menuId)}?category=car-parking-services`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch car parking service menu:", error);
      return null;
    }
  },

  getPopularMenus: async (): Promise<CarParkingServiceMenu[]> => {
    try {
      const response = await apiClient.get<CarParkingServiceMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=car-parking-services`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getPopularMenusByCarParkingService: async (carParkingServiceId: string): Promise<CarParkingServiceMenu[]> => {
    try {
      const response = await apiClient.get<CarParkingServiceMenu[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(carParkingServiceId)}?category=car-parking-services`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular menus:", error);
      return [];
    }
  },

  getRecommendedCarParkingServices: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<CarParkingService[]> => {
    const response = await apiClient.get<CarParkingService[]>(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedMenu: async (carParkingServiceId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(carParkingServiceId, reservationCode)}?category=car-parking-services`
    );
    return response;
  },
};

export default carParkingServiceService;
