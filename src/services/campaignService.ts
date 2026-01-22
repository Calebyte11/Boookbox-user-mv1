/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface Campaign {
  _id: string;
  id?: string;
  name: string;
  title?: string;
  description: string;
  businessId: string;
  businessName?: string;
  businessCategory: "restaurant" | "groceries" | "frozen-foods" | "wine-drinks";
  image: string;
  businessImage?: string;
  profileImage?: string;
  discountPercentage?: number;
  discount?: number | any;
  targetAmount?: number;
  currentAmount?: number;
  numberOfOrders?: number;
  numberOfSales?: number;
  startDate: string;
  endDate: string;
  isActive?: boolean;
  status?: "active" | "upcoming" | "expired";
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CampaignFilters {
  category?: string;
  status?: "ongoing" | "upcoming" | "completed";
  page?: number;
  limit?: number;
}

const apiClient = new ApiClient();

export const campaignService = {
  // Get all campaigns
  getAllCampaigns: async (filters?: CampaignFilters): Promise<Campaign[]> => {
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.append("category", filters.category);
    if (filters?.status) queryParams.append("status", filters.status);
    if (filters?.page) queryParams.append("page", filters.page.toString());
    if (filters?.limit) queryParams.append("limit", filters.limit.toString());

    const endpoint = `${API_ENDPOINTS.CAMPAIGNS.GET_ALL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.getPublic<Campaign[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get recommended campaigns based on user location
  getRecommendedCampaigns: async (
    lat: number,
    lng: number,
    limit?: number,
    page?: number
  ): Promise<Campaign[]> => {
    const endpoint = API_ENDPOINTS.CAMPAIGNS.GET_RECOMMENDED(lat, lng, limit, page);
    const response = await apiClient.get<Campaign[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get top campaigns by number of sales
  getTopCampaigns: async (limit?: number, page?: number): Promise<Campaign[]> => {
    const endpoint = API_ENDPOINTS.CAMPAIGNS.GET_TOP(limit, page);
    const response = await apiClient.get<Campaign[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get ongoing campaigns
  getOngoingCampaigns: async (limit?: number, page?: number): Promise<Campaign[]> => {
    const endpoint = API_ENDPOINTS.CAMPAIGNS.GET_ONGOING(limit, page);
    const response = await apiClient.get<Campaign[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },

  // Get campaign by ID
  getCampaignById: async (campaignId: string): Promise<Campaign | null> => {
    const endpoint = API_ENDPOINTS.CAMPAIGNS.GET_BY_ID(campaignId);
    const response = await apiClient.get<Campaign>(endpoint);
    return response.data || null;
  },

  // Get campaigns by business ID
  getCampaignsByBusiness: async (businessId: string): Promise<Campaign[]> => {
    const endpoint = API_ENDPOINTS.CAMPAIGNS.GET_BY_BUSINESS(businessId);
    const response = await apiClient.get<Campaign[]>(endpoint);
    return Array.isArray(response.data) ? response.data : [];
  },
};
