/**
 * Dynamic Hooks Factory
 * Creates query hooks for any business category without code duplication
 * This factory pattern allows automatic hook resolution based on category
 */

import {
  useAllRestaurantsQuery,
  useRecommendedRestaurantsQuery,
} from "./useRestaurantQueries";
import {
  useAllGroceriesQuery,
  useRecommendedGroceriesQuery,
} from "./useGroceriesQueries";
import {
  useAllFrozenFoodsQuery,
  useRecommendedFrozenFoodsQuery,
} from "./useFrozenFoodsQueries";
import {
  useAllWineDrinksQuery,
  useRecommendedWineDrinksQuery,
} from "./useWineDrinksQueries";
import {
  useAllFoodMarketsQuery,
  useRecommendedFoodMarketsQuery,
} from "./useFoodMarketQueries";
import {
  useAllFruitMarketsQuery,
  useRecommendedFruitMarketsQuery,
} from "./useFruitMarketQueries";
import {
  useAllFreeMarketsQuery,
  useRecommendedFreeMarketsQuery,
} from "./useFreeMarketQueries";
import {
  useAllConfectioneriesQuery,
  useRecommendedConfectioneriesQuery,
} from "./useConfectioneryQueries";
import {
  useAllTransportTicketsQuery,
  useRecommendedTransportTicketsQuery,
} from "./useTransportTicketQueries";
import {
  useAllHangoutTicketsQuery,
  useRecommendedHangoutTicketsQuery,
} from "./useHangoutTicketQueries";
import {
  useAllGiftStoresQuery,
  useRecommendedGiftStoresQuery,
} from "./useGiftStoreQueries";
import {
  useAllPharmaStoresQuery,
  useRecommendedPharmaStoresQuery,
} from "./usePharmaStoreQueries";
import {
  useAllMadeInNigeriaQuery,
  useRecommendedMadeInNigeriaQuery,
} from "./useMadeInNigeriaQueries";
import type { CategoryId } from "@/config/categoryConfig";

/**
 * Hook factory that returns appropriate hooks based on category
 * Centralizes all category-specific hook logic
 */
export const useCategoryQueries = (categoryId: CategoryId) => {
  // Map categories to their respective hooks
  const hooksMap = {
    restaurant: {
      useAll: useAllRestaurantsQuery,
      useRecommended: useRecommendedRestaurantsQuery,
    },
    groceries: {
      useAll: useAllGroceriesQuery,
      useRecommended: useRecommendedGroceriesQuery,
    },
    "frozen-foods": {
      useAll: useAllFrozenFoodsQuery,
      useRecommended: useRecommendedFrozenFoodsQuery,
    },
    "wine-drinks": {
      useAll: useAllWineDrinksQuery,
      useRecommended: useRecommendedWineDrinksQuery,
    },
    "food-market": {
      useAll: useAllFoodMarketsQuery,
      useRecommended: useRecommendedFoodMarketsQuery,
    },
    "fruit-market": {
      useAll: useAllFruitMarketsQuery,
      useRecommended: useRecommendedFruitMarketsQuery,
    },
    "free-market": {
      useAll: useAllFreeMarketsQuery,
      useRecommended: useRecommendedFreeMarketsQuery,
    },
    confectioneries: {
      useAll: useAllConfectioneriesQuery,
      useRecommended: useRecommendedConfectioneriesQuery,
    },
    "transport-tickets": {
      useAll: useAllTransportTicketsQuery,
      useRecommended: useRecommendedTransportTicketsQuery,
    },
    "hangout-tickets": {
      useAll: useAllHangoutTicketsQuery,
      useRecommended: useRecommendedHangoutTicketsQuery,
    },
    "gift-stores": {
      useAll: useAllGiftStoresQuery,
      useRecommended: useRecommendedGiftStoresQuery,
    },
    pharmacy: {
      useAll: useAllPharmaStoresQuery,
      useRecommended: useRecommendedPharmaStoresQuery,
    },
    "made-in-nigeria": {
      useAll: useAllMadeInNigeriaQuery,
      useRecommended: useRecommendedMadeInNigeriaQuery,
    },
    // Placeholder hooks for template categories (you can add actual implementations later)
    bakery: {
      useAll: useAllGroceriesQuery, // Fallback
      useRecommended: useRecommendedGroceriesQuery,
    },
    "beauty-salons": {
      useAll: useAllGroceriesQuery, // Fallback
      useRecommended: useRecommendedGroceriesQuery,
    },
    "fitness-centers": {
      useAll: useAllGroceriesQuery, // Fallback
      useRecommended: useRecommendedGroceriesQuery,
    },
  };

  const hooks = hooksMap[categoryId as keyof typeof hooksMap] || hooksMap.restaurant;
  return hooks;
};

/**
 * Hook to get all items for a category
 */
export const useAllCategoryItems = (categoryId: CategoryId) => {
  const { useAll } = useCategoryQueries(categoryId);
  return useAll();
};

/**
 * Hook to get recommended items for a category
 */
export const useRecommendedCategoryItems = (
  categoryId: CategoryId,
  lat?: number,
  lng?: number,
  limit?: number,
  page?: number,
  options?: Record<string, unknown>
) => {
  const { useRecommended } = useCategoryQueries(categoryId);
  return useRecommended(lat, lng, categoryId, limit, page, options);
};
