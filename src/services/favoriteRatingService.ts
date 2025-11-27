// favoriteRatingService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

// Types
export type BusinessCategory = 'restaurant' | 'groceries' | 'frozen_foods' | 'wine_drinks';

export interface FavoriteToggleResponse {
  success: boolean;
  businessId: string;
  isFavorite: boolean;
  message: string;
}

export interface FavoriteResponse {
  success: boolean;
  isFavorite: boolean;
  message?: string;
}

export interface RatingData {
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  success: boolean;
  rating: number;
  comment?: string;
  averageRating?: number;
  totalRatings?: number;
  message?: string;
}

export interface UserRatingResponse {
  success: boolean;
  data: {
    rating: number;
    comment?: string;
    createdAt: string;
  } | null;
}

// Favorites API
export const getFavoriteStatus = async (
  businessId: string,
  category?: BusinessCategory
): Promise<any> => {
  try {
    const categoryParam = category ? `?category=${category}` : '';
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.GET_FAVOURITES}${categoryParam}`
    );
    
    // Filter for the specific business from the response
    const favorites = Array.isArray(response.data) ? response.data : [];
    const isFavorite = favorites.some(
      (fav: any) => fav.businessId === businessId || fav.restaurantId === businessId
    );
    
    return { success: true, isFavorite };
  } catch (error: any) {
    console.error("Failed to get favorite status:", error);
    throw new Error(
      error.response?.data?.message || "Failed to get favorite status"
    );
  }
};

export const toggleFavorite = async (
  businessId: string,
  category?: BusinessCategory
): Promise<any> => {
  try {
    const categoryParam = category ? `?category=${category}` : '';
    const response = await apiClient.post<any>(
      `${API_ENDPOINTS.BUSINESSES.TOGGLE_FAVOURITE(businessId)}${categoryParam}`
    );
    
    console.log("toggleFavorite response:", response);
    return (
      response || {
        success: false,
        businessId,
        isFavorite: false,
        message: "Failed to toggle favorite",
      }
    );
  } catch (error: any) {
    console.error("Failed to toggle favorite:", error);
    throw new Error(
      error.response?.data?.message || "Failed to toggle favorite"
    );
  }
};

// Rating API
export const getUserRating = async (
  businessId: string,
  category?: BusinessCategory
): Promise<any> => {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.GET_RATINGS(businessId)}?category=${category}`
    );
    
    console.log("getUserRating response:", response.data);
    return response || { success: false };
  } catch (error: any) {
    console.error("Failed to get user rating:", error);
    throw new Error(
      error.response?.data?.message || "Failed to get user rating"
    );
  }
};

export const rateBusiness = async (
  businessId: string,
  ratingData: RatingData,
  category?: BusinessCategory
): Promise<any> => {
  try {
    const categoryParam = category ? `?category=${category}` : '';
    const response = await apiClient.post(
      `${API_ENDPOINTS.BUSINESSES.RATE(businessId)}${categoryParam}`,
      ratingData
    );
    
    return response || { success: false };
  } catch (error: any) {
    console.error("Failed to rate business:", error);
    throw new Error(
      error.response?.data?.message || "Failed to rate business"
    );
  }
};

export const getBusinessRating = async (
  businessId: string,
  category?: BusinessCategory
): Promise<any> => {
  try {
    const response = await apiClient.get(
      `${API_ENDPOINTS.BUSINESSES.GET_RATINGS(businessId)}?category=${category}`
    );
    
    console.log("response-businessRating:", response);
    return response || { success: false };
  } catch (error: any) {
    console.error("Failed to get business rating:", error);
    throw new Error(
      error.response?.data?.message || "Failed to get business rating"
    );
  }
};

// Legacy aliases for backward compatibility (optional - can be removed if not needed)
export const rateRestaurant = rateBusiness;
export const getRestaurantRating = getBusinessRating;