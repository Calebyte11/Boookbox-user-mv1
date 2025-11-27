/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/services/apiClient";

export interface PopularProduct {
  _id: string;
  name?: string;
  packageName?: string;
  description?: string;
  packageDescription?: string;
  price?: number;
  pricing?: number;
  packageImage?: string;
  image?: string;
  images?: string[];
  category?: string;
  restaurantId: string;
  menuId?: string;
  business?: {
    _id: string;
    name: string;
    image?: string;
    profileImage?: string;
    paymentCurrency?: string;
    category?: string;
  };
  restaurant?: {
    _id: string;
    name: string;
    image?: string;
    profileImage?: string;
    restaurantId: string;
    paymentCurrency?: string;
  };
}

// Legacy export for backward compatibility
export type PopularMeal = PopularProduct;

const getPopularProducts = async (): Promise<PopularProduct[]> => {
  const response = await apiClient.get(
    API_ENDPOINTS.BUSINESSES.GET_POPULAR_PRODUCTS
  ) as any;

  if (!response || !response.success) {
    throw new Error("Failed to fetch popular products");
  }

  // Extract the data array from the response
  const productsData = Array.isArray(response.data) ? response.data : [];
  
  // Map 'business' field to 'restaurant' for compatibility with component
  return productsData.map((product: any) => ({
    ...product,
    restaurant: product.business || product.restaurant,
    restaurantId: product.business?._id || product.restaurantId,
  }));
};

export const usePopularProductsQuery = () => {
  return useQuery({
    queryKey: ["popularProducts"],
    queryFn: getPopularProducts,
    staleTime: 1000 * 60 * 15, // 15 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 2,
  });
};

// Legacy export for backward compatibility
export const usePopularMealsQuery = usePopularProductsQuery;


