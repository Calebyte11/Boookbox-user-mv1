/**
 * Universal Data Transformer
 * Transforms raw business data from any category into a unified format
 * No need to create separate transforms for each category
 */

import type { CategoryId } from "@/config/categoryConfig";
import { getCategoryConfig } from "@/config/categoryConfig";
import { formatCurrency } from "@/utils/formatCurrency";

export interface TransformedItem {
  id: string;
  image: string;
  title: string;
  price: string;
  rating: string;
  address: string;
  city: string;
  state: string;
  category: CategoryId;
  detail?: string; // Category-specific detail (cuisineType, storeType, etc.)
  [key: string]: string | number | boolean | undefined; // Allow additional fields
}

/**
 * Extract ID from raw data using category-specific field mapping
 */
const extractId = (data: Record<string, unknown>, categoryId: CategoryId): string => {
  const config = getCategoryConfig(categoryId);
  const idField = config?.idField || "_id";
  
  // Try multiple common ID fields
  return String(
    data[idField] ||
    data._id ||
    data.id ||
    data.businessId ||
    ""
  );
};

/**
 * Extract image from raw data using category-specific field mapping
 */
const extractImage = (data: Record<string, unknown>, categoryId: CategoryId): string => {
  const config = getCategoryConfig(categoryId);
  const imageField = config?.imageField || "profileImage";
  
  return String(data[imageField] || data.image || data.profileImage || "");
};

/**
 * Extract name/title from raw data
 */
const extractTitle = (data: Record<string, unknown>, categoryId: CategoryId): string => {
  const config = getCategoryConfig(categoryId);
  const nameField = config?.nameField || "name";
  
  return String(
    data[nameField] ||
    data.storeName ||
    data.name ||
    "Unknown Business"
  );
};

/**
 * Extract and format price range
 */
const extractPrice = (
  data: Record<string, unknown>,
  categoryId: CategoryId
): string => {
  const config = getCategoryConfig(categoryId);
  if (!config) return "";

  const minPrice = typeof data.minPrice === "number" ? data.minPrice : config.defaultMinPrice;
  const maxPrice = typeof data.maxPrice === "number" ? data.maxPrice : config.defaultMaxPrice;
  const paymentCurrency = String(data.paymentCurrency ?? "NGN");

  return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
    maxPrice,
    paymentCurrency
  )}`;
};

/**
 * Extract category-specific detail field
 */
const extractDetail = (data: Record<string, unknown>, categoryId: CategoryId): string => {
  const categoryConfig = getCategoryConfig(categoryId);
  if (!categoryConfig?.detailField) return "";

  const fieldValue = data[categoryConfig.detailField];
  
  if (Array.isArray(fieldValue)) {
    return fieldValue.join(", ");
  }
  
  return String(fieldValue || "");
};

/**
 * Main transformer function - universally handles all business categories
 * @param rawData Raw data from API
 * @param categoryId The category ID
 * @returns Transformed item in unified format
 */
export const transformBusinessData = (
  rawData: Record<string, unknown>,
  categoryId: CategoryId
): TransformedItem => {
  return {
    id: extractId(rawData, categoryId),
    image: extractImage(rawData, categoryId),
    title: extractTitle(rawData, categoryId),
    price: extractPrice(rawData, categoryId),
    rating: String(rawData.averageRating ?? "4.5"),
    address: String(rawData.address || ""),
    city: String(rawData.city || ""),
    state: String(rawData.state || ""),
    category: categoryId,
    detail: extractDetail(rawData, categoryId),
    // Preserve other fields for extensibility
    ...rawData,
  };
};

/**
 * Transform array of business data
 * @param dataArray Array of raw data from API
 * @param categoryId The category ID
 * @returns Array of transformed items
 */
export const transformBusinessDataArray = (
  dataArray: Record<string, unknown>[] | undefined,
  categoryId: CategoryId
): TransformedItem[] => {
  if (!dataArray || !Array.isArray(dataArray)) {
    return [];
  }

  return dataArray.map((item) => transformBusinessData(item, categoryId));
};
