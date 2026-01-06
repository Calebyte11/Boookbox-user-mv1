import React, { useState, useMemo } from "react";
import { Star, AlertCircle } from "lucide-react";
import Heading from "./Heading";
import { Link } from "react-router-dom";
import Pagination from "./Pagination";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import { useLocationStore } from "@/store/locationStore";
import type { CategoryId } from "@/config/categoryConfig";
import {
  getActiveCategories,
  getCategoryPath,
} from "@/config/categoryConfig";
import {
  useAllCategoryItems,
  useRecommendedCategoryItems,
} from "@/hooks/useCategoryQueries";
import { transformBusinessDataArray } from "@/utils/transformBusinessData";

type RecommendedType = {
  count?: number;
};

const Recommended: React.FC<RecommendedType> = ({ count }) => {
  const [recommendation] = useState(true);
  const locationStore = useLocationStore();

  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("restaurant");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Dynamically get all active categories
  const categories = useMemo(() => {
    return getActiveCategories().map((config) => ({
      id: config.id,
      label: config.label,
    }));
  }, []);

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

  // Dynamically load data for the selected category
  const {
    data: allItemsData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
  } = useAllCategoryItems(selectedCategory);

  const {
    data: recommendedItemsData,
    isLoading: isLoadingRecommended,
    isError: isErrorRecommended,
  } = useRecommendedCategoryItems(
    selectedCategory,
    coords?.lat,
    coords?.lng,
    limit,
    page,
    {
      enabled: !!coords,
    }
  );

  // Transform data for the selected category
  const transformedAllItems = useMemo(() => {
    return transformBusinessDataArray(allItemsData, selectedCategory);
  }, [allItemsData, selectedCategory]);

  const transformedRecommendedItems = useMemo(() => {
    return transformBusinessDataArray(recommendedItemsData, selectedCategory);
  }, [recommendedItemsData, selectedCategory]);

  // Get display data
  const showRecommended = transformedRecommendedItems.length > 0;
  const displayItems = showRecommended
    ? transformedRecommendedItems
    : transformedAllItems;
  const canGoNext = showRecommended ? displayItems.length >= limit : false;

  // Handle category change
  const handleCategoryChange = (category: CategoryId) => {
    setSelectedCategory(category);
    setPage(1);
  };

  // Handle loading state
  if (isLoadingAll) {
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
            <div key={index} className="shrink-0 w-40 space-y-2">
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
    <section id="recomended-section">
      <div id="recommended-heading-container" className="max-w-7xl mx-auto flex justify-between items-center my-[15px]">
        <Heading
          title="Recommended for you"
          CTA="View all"
          status={recommendation}
          link={
            selectedCategory === "restaurant"
              ? "/restaurants/view-all"
              : `/${getCategoryPath(selectedCategory)}/view-all`
          }
        />
      </div>

      {/* Error notifications */}
      {isErrorAll && displayItems.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 text-sm">
            Unable to load fresh data. Please try again later.
          </span>
        </div>
      )}

      {isLoadingRecommended && (
        <div className="mb-4 text-sm text-gray-500">
          Loading recommendations near you…
        </div>
      )}

      {isErrorRecommended && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 text-sm">
            Couldn't load personalized recommendations. Showing general options.
          </span>
        </div>
      )}

      {/* Category Filter Navigation */}
      <div id="category-filter-nav" className="mb-6 ">
        <ul className="flex gap-0 overflow-x-auto scrollbar- ">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0 border-b-2 border-gray-400 ">
              <button
                onClick={() => handleCategoryChange(category.id)}
                className={`
                  px-3 py-1 text-[13px] font-medium transition-colors whitespace-nowrap h-full
                  ${
                    selectedCategory === category.id
                      ? "bg-white-500 text-gray-600 border border-gray-400 rounded-t-sm rounded-b-sm"
                      : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
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
                item.category === "restaurant" 
                  ? `/restaurants/${item.id || item.title}?category=${selectedCategory}`
                  : `/${getCategoryPath(item.category)}/${item.id || item.title}?category=${selectedCategory}`
              }
              key={item.id || index}
              className="flex flex-col gap-2 shadow-sm p-2 bg-[#F8F8F8] cursor-pointer hover:shadow-md transition-shadow"
            >
              {item.image?
                  <img
                    src={item.image}
                    alt={item.title || "Business"}
                    className="rounded-lg object-cover h-40 w-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "";
                    }}
                  />
                  : <img src={ActivityHero} alt="" />
              }
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
                    : "Order items"}
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
          isLoading={isLoadingRecommended}
        />
      )}
    </section>
  );
};

export default Recommended;
