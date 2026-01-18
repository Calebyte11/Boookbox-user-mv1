/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface VegetableMarket {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  vegetableMarketId: string;
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

export interface VegetableMarketProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  vegetableMarketId: string;
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

export const vegetableMarketService = {
  getAllVegetableMarkets: async (category: string): Promise<VegetableMarket[]> => {
    const response = await apiClient.get<VegetableMarket[]>(
      `${API_ENDPOINTS.BUSINESSES.GET_ALL(category)}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  getVegetableMarketByLocation: async (
    filters: LocationFilters
  ): Promise<VegetableMarket[]> => {
    const queryParams = new URLSearchParams();
    if (filters.latitude) queryParams.append("latitude", filters.latitude.toString());
    if (filters.longitude) queryParams.append("longitude", filters.longitude.toString());
    if (filters.radius) queryParams.append("radius", filters.radius.toString());
    if (filters.minPrice) queryParams.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_BY_LOCATION}?category=vegetable-market${queryParams.toString()}`;
    const response = await apiClient.getPublic<VegetableMarket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getNearbyVegetableMarkets: async (params: NearbyParams): Promise<VegetableMarket[]> => {
    const queryParams = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });
    if (params.radius) queryParams.append("radius", params.radius.toString());

    const endpoint = `${API_ENDPOINTS.BUSINESSES.GET_NEARBY}?category=vegetable-market${queryParams.toString()}`;
    const response = await apiClient.get<VegetableMarket[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  getVegetableMarketById: async (
    vegetableMarketId: string
  ): Promise<VegetableMarket | null> => {
    try {
      const response = await apiClient.get<VegetableMarket>(
        `${API_ENDPOINTS.BUSINESSES.VIEW_BY_ID(vegetableMarketId)}?category=vegetable-market`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch vegetable market:", error);
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw error;
      }
      return null;
    }
  },

  getVegetableMarketProducts: async (
    vegetableMarketId: string
  ): Promise<VegetableMarketProduct[]> => {
    try {
      const response = await apiClient.get<VegetableMarketProduct[]>(
        `${API_ENDPOINTS.BUSINESSES.LIST_PRODUCTS(vegetableMarketId)}?category=vegetable-market`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch vegetable market products:", error);
      return [];
    }
  },

  getVegetableMarketProduct: async (
    vegetableMarketId: string,
    productId: string
  ): Promise<VegetableMarketProduct | null> => {
    try {
      const response = await apiClient.get<VegetableMarketProduct>(
        `${API_ENDPOINTS.BUSINESSES.GET_PRODUCT_INFO(vegetableMarketId, productId)}?category=vegetable-market`
      );
      return response.data || null;
    } catch (error) {
      console.error("Failed to fetch vegetable market product:", error);
      return null;
    }
  },

  getPopularProducts: async (): Promise<VegetableMarketProduct[]> => {
    try {
      const response = await apiClient.get<VegetableMarketProduct[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS}?category=vegetable-market`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular products:", error);
      return [];
    }
  },

  getPopularProductsByMarket: async (vegetableMarketId: string): Promise<VegetableMarketProduct[]> => {
    try {
      const response = await apiClient.get<VegetableMarketProduct[]>(
        `${API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS_BY_BUSINESS(vegetableMarketId)}?category=vegetable-market`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error("Failed to fetch popular products:", error);
      return [];
    }
  },

  getRecommendedVegetableMarkets: async (
    lat: number,
    lng: number,
    category?: string,
    limit?: number,
    page?: number
  ): Promise<VegetableMarket[]> => {
    const response = await apiClient.get<VegetableMarket[]>(
      API_ENDPOINTS.BUSINESSES.GET_RECOMMENDED_BUSINESS(lat, lng, category, limit, page)
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  findReservedProduct: async (vegetableMarketId: string, reservationCode: string): Promise<any> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.FIND_RESERVED_PRODUCT(vegetableMarketId, reservationCode)}?category=vegetable-market`
    );
    return response;
  },
};

export default vegetableMarketService;
