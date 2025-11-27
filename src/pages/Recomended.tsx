/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { Star, AlertCircle } from "lucide-react";
import Heading from "@/components/Heading";
import { Link } from "react-router-dom";
import Pagination from "./Pagination";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  useAllRestaurantsQuery,
  useRecommendedRestaurantsQuery,
} from "@/hooks/useRestaurantQueries";
import {
  useAllGroceriesQuery,
  useRecommendedGroceriesQuery,
} from "@/hooks/useGroceriesQueries";
import {
  useAllFrozenFoodsQuery,
  useRecommendedFrozenFoodsQuery,
} from "@/hooks/useFrozenFoodsQueries";
import {
  useAllWineDrinksQuery,
  useRecommendedWineDrinksQuery,
} from "@/hooks/useWineDrinksQueries";

import { useLocationStore } from "@/store/locationStore";

type RecommendedType = {
  count?: number;
};

type CategoryType = "restaurant" | "groceries" | "frozen-foods" | "wine&drinks";

// Helper function to map category IDs to route paths
// const getCategoryRoute = (category: CategoryType): string => {
//   const routeMap: Record<CategoryType, string> = {
//     restaurant: "restaurants",
//     groceries: "groceries",
//     "frozen-foods": "frozen-foods",
//     "wine&drinks": "wine-drinks",
//   };

//   return routeMap[category] || category;
// };

const Recommended: React.FC<RecommendedType> = ({ count }) => {
  const [recommendation] = useState(true);
  const locationStore = useLocationStore();

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryType>("restaurant");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const categories = [
    { id: "restaurant" as CategoryType, label: "Restaurant" },
    { id: "groceries" as CategoryType, label: "Groceries" },
    { id: "frozen-foods" as CategoryType, label: "Frozen Foods" },
    { id: "wine&drinks" as CategoryType, label: "Wine & Drinks" },
  ];

  // Resolve coordinates
  const coords = useMemo(() => {
    const manual = locationStore.manualLocation?.position;
    const gps = locationStore.position;
    if (manual?.latitude && manual?.longitude) {
      return { lat: manual.latitude, lng: manual.longitude } as const;
    }
    if (gps?.latitude && gps?.longitude) {
      return { lat: gps.latitude, lng: gps.longitude } as const;
    }
    return null;
  }, [locationStore.manualLocation, locationStore.position]);

  // ============== RESTAURANT QUERIES ==============
  const {
    data: restaurantData,
    isLoading: isLoadingRestaurants,
    error: restaurantError,
    isError: isRestaurantError,
  } = useAllRestaurantsQuery();

  const {
    data: recommendedRestaurants,
    isLoading: isLoadingRecommendedRestaurants,
    isError: isRecommendedRestaurantsError,
  } = useRecommendedRestaurantsQuery(
    coords?.lat,
    coords?.lng,
    selectedCategory,
    limit,
    page,
    {
      enabled: !!coords && selectedCategory === "restaurant",
    }
  );

  // ============== GROCERIES QUERIES ==============
  const {
    data: groceriesData,
    isLoading: isLoadingGroceries,
    error: groceriesError,
    isError: isGroceriesError,
  } = useAllGroceriesQuery();

  const {
    data: recommendedGroceries,
    isLoading: isLoadingRecommendedGroceries,
    isError: isRecommendedGroceriesError,
  } = useRecommendedGroceriesQuery(
    coords?.lat,
    coords?.lng,
    selectedCategory,
    limit,
    page,
    {
      enabled: !!coords && selectedCategory === "groceries",
    }
  );

  // ============== FROZEN FOODS QUERIES ==============
  const {
    data: frozenFoodsData,
    isLoading: isLoadingFrozenFoods,
    error: frozenFoodsError,
    isError: isFrozenFoodsError,
  } = useAllFrozenFoodsQuery();

  const {
    data: recommendedFrozenFoods,
    isLoading: isLoadingRecommendedFrozenFoods,
    isError: isRecommendedFrozenFoodsError,
  } = useRecommendedFrozenFoodsQuery(
    coords?.lat,
    coords?.lng,
    selectedCategory,
    limit,
    page,
    {
      enabled: !!coords && selectedCategory === "frozen-foods",
    }
  );

  // ============== WINE & DRINKS QUERIES ==============
  const {
    data: wineDrinksData,
    isLoading: isLoadingWineDrinks,
    error: wineDrinksError,
    isError: isWineDrinksError,
  } = useAllWineDrinksQuery();

  const {
    data: recommendedWineDrinks,
    isLoading: isLoadingRecommendedWineDrinks,
    isError: isRecommendedWineDrinksError,
  } = useRecommendedWineDrinksQuery(
    coords?.lat,
    coords?.lng,
    selectedCategory,
    limit,
    page,
    {
      enabled: !!coords && selectedCategory === "wine&drinks",
    }
  );

  // ============== TRANSFORM RESTAURANTS ==============
  const transformedRestaurants = useMemo(() => {
    if (!restaurantData || !Array.isArray(restaurantData)) return [];

    return restaurantData.map((restaurant: any) => ({
      id: restaurant.restaurantId || restaurant._id || restaurant.id || restaurant.businessId || "",
      image: restaurant.profileImage || "",
      title: restaurant.name || "Unknown Restaurant",
      price: (() => {
        const minPrice = restaurant.minPrice ?? 2000;
        const maxPrice = restaurant.maxPrice ?? 20000;
        const paymentCurrency = restaurant.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: restaurant.averageRating?.toString() || "4.5",
      address: restaurant.address || "",
      city: restaurant.city || "",
      state: restaurant.state || "",
      cuisineType: Array.isArray(restaurant.cuisineType)
        ? restaurant.cuisineType.join(", ")
        : restaurant.cuisineType || "",
      category: "restaurant" as CategoryType,
    }));
  }, [restaurantData]);

  const transformedRecommendedRestaurants = useMemo(() => {
    if (!recommendedRestaurants || !Array.isArray(recommendedRestaurants))
      return [];
    return recommendedRestaurants.map((restaurant: any) => ({
      id: restaurant.restaurantId || restaurant._id || restaurant.id || restaurant.businessId || "",
      image: restaurant.profileImage || "",
      title: restaurant.name || "Unknown Restaurant",
      price: (() => {
        const minPrice = restaurant.minPrice ?? 2000;
        const maxPrice = restaurant.maxPrice ?? 20000;
        const paymentCurrency = restaurant.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: restaurant.averageRating?.toString() || "4.5",
      address: restaurant.address || "",
      city: restaurant.city || "",
      state: restaurant.state || "",
      cuisineType: Array.isArray(restaurant.cuisineType)
        ? restaurant.cuisineType.join(", ")
        : restaurant.cuisineType || "",
      category: "restaurant" as CategoryType,
    }));
  }, [recommendedRestaurants]);

  // ============== TRANSFORM GROCERIES ==============
  const transformedGroceries = useMemo(() => {
    if (!groceriesData || !Array.isArray(groceriesData)) return [];

    return groceriesData.map((grocery: any) => ({
      id: grocery.groceryId || grocery.id || "",
      image: grocery.profileImage || grocery.image || "",
      title: grocery.name || grocery.storeName || "Unknown Store",
      price: (() => {
        const minPrice = grocery.minPrice ?? 500;
        const maxPrice = grocery.maxPrice ?? 15000;
        const paymentCurrency = grocery.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: grocery.averageRating?.toString() || "4.5",
      address: grocery.address || "",
      city: grocery.city || "",
      state: grocery.state || "",
      storeType: grocery.storeType || "Grocery Store",
      category: "groceries" as CategoryType,
    }));
  }, [groceriesData]);

  const transformedRecommendedGroceries = useMemo(() => {
    if (!recommendedGroceries || !Array.isArray(recommendedGroceries))
      return [];
    return recommendedGroceries.map((grocery: any) => ({
      id: grocery.groceryId || grocery.id || "",
      image: grocery.profileImage || grocery.image || "",
      title: grocery.name || grocery.storeName || "Unknown Store",
      price: (() => {
        const minPrice = grocery.minPrice ?? 500;
        const maxPrice = grocery.maxPrice ?? 15000;
        const paymentCurrency = grocery.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: grocery.averageRating?.toString() || "4.5",
      address: grocery.address || "",
      city: grocery.city || "",
      state: grocery.state || "",
      storeType: grocery.storeType || "Grocery Store",
      category: "groceries" as CategoryType,
    }));
  }, [recommendedGroceries]);

  // ============== TRANSFORM FROZEN FOODS ==============
  const transformedFrozenFoods = useMemo(() => {
    if (!frozenFoodsData || !Array.isArray(frozenFoodsData)) return [];

    return frozenFoodsData.map((frozen: any) => ({
      id: frozen.frozenFoodId || frozen._id || frozen.businessId || frozen.id || "",
      image: frozen.profileImage || frozen.image || "",
      title: frozen.name || frozen.storeName || "Unknown Store",
      price: (() => {
        const minPrice = frozen.minPrice ?? 1000;
        const maxPrice = frozen.maxPrice ?? 25000;
        const paymentCurrency = frozen.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: frozen.averageRating?.toString() || "4.5",
      address: frozen.address || "",
      city: frozen.city || "",
      state: frozen.state || "",
      productType: frozen.productType || "Frozen Foods",
      category: "frozen-foods" as CategoryType,
    }));
  }, [frozenFoodsData]);

  const transformedRecommendedFrozenFoods = useMemo(() => {
    if (!recommendedFrozenFoods || !Array.isArray(recommendedFrozenFoods))
      return [];
    return recommendedFrozenFoods.map((frozen: any) => ({
      id: frozen.frozenFoodId || frozen._id || frozen.businessId || frozen.id || "",
      image: frozen.profileImage || frozen.image || "",
      title: frozen.name || frozen.storeName || "Unknown Store",
      price: (() => {
        const minPrice = frozen.minPrice ?? 1000;
        const maxPrice = frozen.maxPrice ?? 25000;
        const paymentCurrency = frozen.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: frozen.averageRating?.toString() || "4.5",
      address: frozen.address || "",
      city: frozen.city || "",
      state: frozen.state || "",
      productType: frozen.productType || "Frozen Foods",
      category: "frozen-foods" as CategoryType,
    }));
  }, [recommendedFrozenFoods]);

  // ============== TRANSFORM WINE & DRINKS ==============
  const transformedWineDrinks = useMemo(() => {
    if (!wineDrinksData || !Array.isArray(wineDrinksData)) return [];

    return wineDrinksData.map((wine: any) => ({
      id: wine.wineDrinkId || wine._id || wine.businessId || wine.id || "",
      image: wine.profileImage || wine.image || "",
      title: wine.name || wine.storeName || "Unknown Store",
      price: (() => {
        const minPrice = wine.minPrice ?? 1500;
        const maxPrice = wine.maxPrice ?? 50000;
        const paymentCurrency = wine.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: wine.averageRating?.toString() || "4.5",
      address: wine.address || "",
      city: wine.city || "",
      state: wine.state || "",
      beverageType: wine.beverageType || "Wine & Drinks",
      category: "wine-drinks" as CategoryType,
    }));
  }, [wineDrinksData]);

  const transformedRecommendedWineDrinks = useMemo(() => {
    if (!recommendedWineDrinks || !Array.isArray(recommendedWineDrinks))
      return [];
    return recommendedWineDrinks.map((wine: any) => ({
      id: wine.wineDrinkId || wine._id || wine.businessId || wine.id || "",
      image: wine.profileImage || wine.image || "",
      title: wine.name || wine.storeName || "Unknown Store",
      price: (() => {
        const minPrice = wine.minPrice ?? 1500;
        const maxPrice = wine.maxPrice ?? 50000;
        const paymentCurrency = wine.paymentCurrency ?? "NGN";
        return `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`;
      })(),
      rating: wine.averageRating?.toString() || "4.5",
      address: wine.address || "",
      city: wine.city || "",
      state: wine.state || "",
      beverageType: wine.beverageType || "Wine & Drinks",
      category: "wine-drinks" as CategoryType,
    }));
  }, [recommendedWineDrinks]);

  // ============== GET CURRENT CATEGORY DATA ==============
  const getCurrentCategoryData = () => {
    switch (selectedCategory) {
      case "restaurant":
        return {
          allItems: transformedRestaurants,
          recommendedItems: transformedRecommendedRestaurants,
          isLoading: isLoadingRestaurants,
          isLoadingRecommended: isLoadingRecommendedRestaurants,
          isError: isRestaurantError,
          isRecommendedError: isRecommendedRestaurantsError,
          error: restaurantError,
        };
      case "groceries":
        return {
          allItems: transformedGroceries,
          recommendedItems: transformedRecommendedGroceries,
          isLoading: isLoadingGroceries,
          isLoadingRecommended: isLoadingRecommendedGroceries,
          isError: isGroceriesError,
          isRecommendedError: isRecommendedGroceriesError,
          error: groceriesError,
        };
      case "frozen-foods":
        return {
          allItems: transformedFrozenFoods,
          recommendedItems: transformedRecommendedFrozenFoods,
          isLoading: isLoadingFrozenFoods,
          isLoadingRecommended: isLoadingRecommendedFrozenFoods,
          isError: isFrozenFoodsError,
          isRecommendedError: isRecommendedFrozenFoodsError,
          error: frozenFoodsError,
        };
      case "wine&drinks":
        return {
          allItems: transformedWineDrinks,
          recommendedItems: transformedRecommendedWineDrinks,
          isLoading: isLoadingWineDrinks,
          isLoadingRecommended: isLoadingRecommendedWineDrinks,
          isError: isWineDrinksError,
          isRecommendedError: isRecommendedWineDrinksError,
          error: wineDrinksError,
        };
      default:
        return {
          allItems: [],
          recommendedItems: [],
          isLoading: false,
          isLoadingRecommended: false,
          isError: false,
          isRecommendedError: false,
          error: null,
        };
    }
  };

  const currentData = getCurrentCategoryData();
  const showRecommended = currentData.recommendedItems.length > 0;
  const displayItems = showRecommended
    ? currentData.recommendedItems
    : currentData.allItems;
  const canGoNext = showRecommended ? displayItems.length >= limit : false;

  // Handle category change
  const handleCategoryChange = (category: CategoryType) => {
    setSelectedCategory(category);
    setPage(1);
  };

  // Handle loading state
  if (currentData.isLoading) {
    return (
      <section>
        <div className="max-w-7xl mx-auto flex justify-between items-center my-[24px]">
          <Heading
            title="Recommended for you"
            CTA="View all"
            status={recommendation}
          />
        </div>
        <div className="flex gap-4 overflow-x-auto px-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-shrink-0 w-40 space-y-2">
              <div className="w-full h-24 bg-gray-200 animate-pulse rounded-lg" />
              <div className="w-full h-4 bg-gray-200 animate-pulse rounded" />
              <div className="w-2/3 h-3 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="max-w-7xl mx-auto flex justify-between items-center my-[15px]">
        <Heading
          title="Recommended for you"
          CTA="View all"
          status={recommendation}
          link={
            selectedCategory === "restaurant"
              ? "/restaurants/view-all"
              : `/${selectedCategory}/view-all`
          }
        />
      </div>

      {/* Error notifications */}
      {currentData.isError && displayItems.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 text-sm">
            Unable to load fresh data. Please try again later.
          </span>
        </div>
      )}

      {currentData.isLoadingRecommended && (
        <div className="mb-4 text-sm text-gray-500">
          Loading recommendations near you…
        </div>
      )}

      {currentData.isRecommendedError && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 text-sm">
            Couldn't load personalized recommendations. Showing general options.
          </span>
        </div>
      )}

      {/* Category Filter Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex gap-0 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <li key={category.id} className="flex-shrink-0">
              <button
                onClick={() => handleCategoryChange(category.id)}
                className={`
                  px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap
                  ${
                    selectedCategory === category.id
                      ? "bg-gray-100 text-gray-900 border-b-2 border-primary"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                {category.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Display items */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayItems.length > 0 ? (
          displayItems.slice(0, count || 4).map((item, index) => (
            <Link
              to={
                selectedCategory === "restaurant"
              ? `/restaurants/${
                item.id || item.title
              }?category=restaurant`
              : `/${selectedCategory}/${item.id || item.title}?category=${selectedCategory}`
              }
              key={item.id || index}
              className="flex flex-col gap-2 shadow-sm p-2 bg-[#F8F8F8] cursor-pointer hover:shadow-md transition-shadow"
            >
              <img
                src={item.image}
                alt={`${selectedCategory}-image`}
                className="rounded-lg object-cover h-[10rem] w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "";
                }}
              />
              <div className="flex flex-col gap-1 mt-2">
                <p
                  className="capitalize font-semibold text-sm truncate"
                  title={item.title}
                >
                  {item.title}
                </p>
                <p className="font-normal tracking-tight text-sm">
                  {item.price}
                </p>
                <span className="text-gray-400 inline-flex items-center text-sm gap-1">
                  <Star className="text-black w-4 h-4" fill="currentColor" />
                  {item.rating}
                </span>
                {(item.city || item.state) && (
                  <span className="text-gray-500 text-xs mt-1">
                    {item.city}
                    {item.city && item.state ? ", " : ""}
                    {item.state}
                  </span>
                )}
              </div>
              <div className="bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 inline-flex justify-center">
                <span className="text-center text-sm">
                  {selectedCategory === "restaurant"
                    ? "Book a meal"
                    : "Book an item"}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500">
            No{" "}
            {categories
              .find((c) => c.id === selectedCategory)
              ?.label.toLowerCase()}{" "}
            available at the moment.
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {showRecommended && displayItems.length > 0 && (
        <Pagination
          page={page}
          onPageChange={(p) => setPage(p)}
          canGoNext={canGoNext}
          isLoading={currentData.isLoadingRecommended}
        />
      )}
    </section>
  );
};

export default Recommended;
