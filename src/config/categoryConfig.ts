/**
 * Category Configuration System
 * This file defines all business categories and their properties
 * Easily add new categories without modifying component logic
 */

export type CategoryId =
  | "restaurant"
  | "groceries"
  | "frozen-foods"
  | "wine-drinks"
  | "food-market"
  | "fruit-market"
  | "free-market"
  | "confectionery"
  | "transport-tickets"
  | "hangout-tickets"
  | "gift-stores"
  | "bakery"
  | "pharma-stores"
  | "made-in-nigeria"
  | "hospitality"
  | "car-parking-services"
  | "nightlife"
  | "vegetable-market";

export interface CategoryConfig {
  id: CategoryId;
  label: string;
  // description: string;
  path: string;
  icon?: string;
  defaultMinPrice: number;
  defaultMaxPrice: number;
  detailField?: string; // Field name for category-specific detail (e.g., cuisineType, storeType)
  idField?: string; // Primary ID field in API response
  imageField?: string; // Primary image field in API response
  nameField?: string; // Primary name field in API response
}

/**
 * Category Registry
 * Add new categories here and they automatically become available throughout the app
 */
export const CATEGORY_REGISTRY: Record<CategoryId, CategoryConfig> = {
  restaurant: {
    id: "restaurant",
    label: "Restaurants",
    path: "restaurants",
    defaultMinPrice: 500,
    defaultMaxPrice: 100000,
    detailField: "restaurantDetails",
    idField: "restaurantId",
    imageField: "profileImage",
    nameField: "name",
  },
  groceries: {
    id: "groceries",
    label: "Groceries",
    path: "groceries",
    defaultMinPrice: 100,
    defaultMaxPrice: 50000,
    detailField: "groceriesDetails",
    idField: "groceriesId",
    imageField: "profileImage",
    nameField: "name",
  },
  "frozen-foods": {
    id: "frozen-foods",
    label: "Frozen Foods",
    path: "frozen-foods",
    defaultMinPrice: 500,
    defaultMaxPrice: 50000,
    detailField: "frozenFoodsDetails",
    idField: "frozenFoodsId",
    imageField: "profileImage",
    nameField: "name",
  },
  "wine-drinks": {
    id: "wine-drinks",
    label: "Wine & Drinks",
    path: "wine-drinks",
    defaultMinPrice: 1000,
    defaultMaxPrice: 100000,
    detailField: "wineDrinksDetails",
    idField: "wineDrinksId",
    imageField: "profileImage",
    nameField: "name",
  },
  "food-market": {
    id: "food-market",
    label: "Food Market",
    path: "food-market",
    defaultMinPrice: 100,
    defaultMaxPrice: 50000,
    detailField: "foodMarketDetails",
    idField: "foodMarketId",
    imageField: "profileImage",
    nameField: "name",
  },
  "fruit-market": {
    id: "fruit-market",
    label: "Fruit Market",
    path: "fruit-market",
    defaultMinPrice: 100,
    defaultMaxPrice: 30000,
    detailField: "fruitMarketDetails",
    idField: "fruitMarketId",
    imageField: "profileImage",
    nameField: "name",
  },
  "free-market": {
    id: "free-market",
    label: "Free Market",
    path: "free-market",
    defaultMinPrice: 100,
    defaultMaxPrice: 100000,
    detailField: "freeMarketDetails",
    idField: "freeMarketId",
    imageField: "profileImage",
    nameField: "name",
  },
  confectionery: {
    id: "confectionery",
    label: "Confectioneries",
    path: "confectionery",
    defaultMinPrice: 500,
    defaultMaxPrice: 50000,
    detailField: "confectioneryDetails",
    idField: "confectioneryId",
    imageField: "profileImage",
    nameField: "name",
  },
  "transport-tickets": {
    id: "transport-tickets",
    label: "Transport Tickets",
    path: "transport-tickets",
    defaultMinPrice: 500,
    defaultMaxPrice: 50000,
    detailField: "transportTicketDetails",
    idField: "transportTicketId",
    imageField: "profileImage",
    nameField: "name",
  },
  "hangout-tickets": {
    id: "hangout-tickets",
    label: "Hangout Tickets",
    path: "hangout-tickets",
    defaultMinPrice: 1000,
    defaultMaxPrice: 100000,
    detailField: "hangoutTicketDetails",
    idField: "hangoutTicketId",
    imageField: "profileImage",
    nameField: "name",
  },
  "gift-stores": {
    id: "gift-stores",
    label: "Gift Stores",
    path: "gift-stores",
    defaultMinPrice: 1000,
    defaultMaxPrice: 100000,
    detailField: "giftStoreDetails",
    idField: "giftStoreId",
    imageField: "profileImage",
    nameField: "name",
  },
  bakery: {
    id: "bakery",
    label: "Bakery",
    path: "bakery",
    defaultMinPrice: 500,
    defaultMaxPrice: 30000,
    detailField: "bakeryDetails",
    idField: "bakeryId",
    imageField: "profileImage",
    nameField: "name",
  },
  "pharma-stores": {
    id: "pharma-stores",
    label: "Pharma Stores",
    path: "pharma-stores",
    defaultMinPrice: 100,
    defaultMaxPrice: 50000,
    detailField: "pharmaStoreDetails",
    idField: "pharmaStoreId",
    imageField: "profileImage",
    nameField: "name",
  },
  "made-in-nigeria": {
    id: "made-in-nigeria",
    label: "Made in Nigeria",
    path: "made-in-nigeria",
    defaultMinPrice: 1000,
    defaultMaxPrice: 100000,
    detailField: "madeInNigeriaDetails",
    idField: "madeInNigeriaId",
    imageField: "profileImage",
    nameField: "name",
  },
  hospitality: {
    id: "hospitality",
    label: "Hospitality",
    path: "hospitality",
    defaultMinPrice: 5000,
    defaultMaxPrice: 500000,
    detailField: "hospitalityDetails",
    idField: "hospitalityId",
    imageField: "profileImage",
    nameField: "name",
  },
  "car-parking-services": {
    id: "car-parking-services",
    label: "Car Parking Services",
    path: "car-parking-services",
    defaultMinPrice: 500,
    defaultMaxPrice: 50000,
    detailField: "carParkingDetails",
    idField: "carParkingServiceId",
    imageField: "profileImage",
    nameField: "name",
  },
  nightlife: {
    id: "nightlife",
    label: "Night Life",
    path: "nightlife",
    defaultMinPrice: 1000,
    defaultMaxPrice: 100000,
    detailField: "nightlifeDetails",
    idField: "nightlifeVenueId",
    imageField: "profileImage",
    nameField: "name",
  },
  "vegetable-market": {
    id: "vegetable-market",
    label: "Vegetable Market",
    path: "vegetable-market",
    defaultMinPrice: 100,
    defaultMaxPrice: 30000,
    detailField: "vegetableMarketDetails",
    idField: "vegetableMarketId",
    imageField: "profileImage",
    nameField: "name",
  },
};

/**
 * Get list of active categories
 */
export const getActiveCategories = (): CategoryConfig[] => {
  return Object.values(CATEGORY_REGISTRY);
};

/**
 * Get specific category config
 */
export const getCategoryConfig = (categoryId: CategoryId): CategoryConfig | undefined => {
  return CATEGORY_REGISTRY[categoryId];
};

/**
 * Get category label
 */
export const getCategoryLabel = (categoryId: CategoryId): string => {
  return CATEGORY_REGISTRY[categoryId]?.label || categoryId;
};

/**
 * Get category path
 */
export const getCategoryPath = (categoryId: CategoryId): string => {
  const config = CATEGORY_REGISTRY[categoryId];
  return config?.path || categoryId;
};
