/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import Confetti from "react-confetti";
import debounce from "debounce";
import RequestPackageForm from "@/components/RequestPackageForm";
import RequestPackageModal from "@/components/RequestPackageModal";

// Dynamic imports based on category
import {
  useRestaurantDetailQuery,
  usePopularMenusByRestaurantQuery,
  useRestaurantReservedMenu,
  useRestaurantMenusQuery,
} from "@/hooks/useRestaurantQueries";

import {
  useGroceriesDetailQuery,
  usePopularProductsByGroceriesQuery,
  useGroceriesReservedProduct,
  useGroceriesProductsQuery,
} from "@/hooks/useGroceriesQueries";

import {
  useFrozenFoodsDetailQuery,
  usePopularProductsByFrozenFoodsQuery,
  useFrozenFoodsReservedProduct,
  useFrozenFoodsProductsQuery,
} from "@/hooks/useFrozenFoodsQueries";

import {
  useWineDrinksDetailQuery,
  usePopularProductsByWineDrinksQuery,
  useWineDrinksReservedProduct,
  useWineDrinksProductsQuery,
} from "@/hooks/useWineDrinksQueries";

import {
  useFavoriteStatus,
  useToggleFavorite,
  useUserRating,
  useRateRestaurant,
} from "@/hooks/useFavoriteRating";
import RatingModal from "@/components/RatingModal";

import {
  Star,
  User,
  Heart,
  ChevronLeft,
  Users,
  Search,
  X,
  AlertCircle,
  Soup,
  Utensils,
} from "lucide-react";
import MenuCard from "@/components/MenuCard";
import * as Tabs from "@radix-ui/react-tabs";
import Heading from "../components/sponsor/Heading";
// import Reslider from "@/components/ReSlide";
import CartButton from "@/components/CartButton";
import refuel from "@/assets/images/refuel.png";
import useCartStore from "@/store/cartStore";
import NotchAreaHeader from "@/components/NotchAreaHeader";
import { MealDetailsSkeleton } from "@/components/SkeletonLoader";
import SignatureBowelCard from "@/components/SignatureBowelCard";
import { renderBadges, hasBadges } from "@/utils/badgeUtil";

type BusinessCategory =
  | "restaurant"
  | "groceries"
  | "frozen-foods"
  | "wine-drinks";

// Helper function to get the appropriate hooks based on category
const getQueryHooks = (category: BusinessCategory) => {
  switch (category) {
    case "restaurant":
      return {
        useDetailQuery: useRestaurantDetailQuery,
        usePopularMenusQuery: usePopularMenusByRestaurantQuery,
        useReservedMenuQuery: useRestaurantReservedMenu,
        useMenusQuery: useRestaurantMenusQuery,
      };
    case "groceries":
      return {
        useDetailQuery: useGroceriesDetailQuery,
        usePopularMenusQuery: usePopularProductsByGroceriesQuery,
        useReservedMenuQuery: useGroceriesReservedProduct,
        useMenusQuery: useGroceriesProductsQuery,
      };
    case "frozen-foods":
      return {
        useDetailQuery: useFrozenFoodsDetailQuery,
        usePopularMenusQuery: usePopularProductsByFrozenFoodsQuery,
        useReservedMenuQuery: useFrozenFoodsReservedProduct,
        useMenusQuery: useFrozenFoodsProductsQuery,
      };
    case "wine-drinks":
      return {
        useDetailQuery: useWineDrinksDetailQuery,
        usePopularMenusQuery: usePopularProductsByWineDrinksQuery,
        useReservedMenuQuery: useWineDrinksReservedProduct,
        useMenusQuery: useWineDrinksProductsQuery,
      };
    default:
      throw new Error(`Unknown business category: ${category}`);
  }
};

// Helper function to get display labels based on category
const getCategoryLabels = (category: BusinessCategory) => {
  const labels = {
    restaurant: {
      businessType: "Restaurant",
      itemsLabel: "Meals",
      searchPlaceholder: "Search",
      reservedPlaceholder: "Search reserved Meal at",
      popularTab: "Popular Menus",
      signatureTab: "Signature Bowls",
      noItemsMessage: "No meals found",
      noPopularMessage: "No popular items available",
      noSignatureMessage: "No signature bowls available",
    },
    groceries: {
      businessType: "Grocery Store",
      itemsLabel: "Products",
      searchPlaceholder: "Search products",
      reservedPlaceholder: "Search reserved Products at",
      popularTab: "Popular Items",
      signatureTab: "All Products",
      noItemsMessage: "No products found",
      noPopularMessage: "No popular products available",
      noSignatureMessage: "No products available",
    },
    "frozen-foods": {
      businessType: "Frozen Foods Store",
      itemsLabel: "Products",
      searchPlaceholder: "Search frozen foods",
      reservedPlaceholder: "Search reserved Frozen Foods at",
      popularTab: "Popular Items",
      signatureTab: "All Frozen Foods",
      noItemsMessage: "No frozen foods found",
      noPopularMessage: "No popular items available",
      noSignatureMessage: "No frozen foods available",
    },
    "wine-drinks": {
      businessType: "Wine & Drinks Store",
      itemsLabel: "Products",
      searchPlaceholder: "Search drinks",
      reservedPlaceholder: "Search reserved Drinks at",
      popularTab: "Popular Drinks",
      signatureTab: "All Drinks",
      noItemsMessage: "No drinks found",
      noPopularMessage: "No popular drinks available",
      noSignatureMessage: "No drinks available",
    },
  };
  return labels[category];
};

// ================= INTERFACES =======================
interface PackageItem {
  id: string;
  brand: string;
  businessCategory: string;
  description: string;
  image: string;
  package: string;
  price?: number;
  restaurantId: string;
  menuId: string;
  currency: string;
  category: any;
}

const BusinessProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{
    restaurantId: string;
  }>();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");

  // Use restaurantId from params
  const businessId = restaurantId;

  // All hooks must be called unconditionally before any return
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"general" | "reserved">(
    "general"
  );
  const [isSearchingReserved, setIsSearchingReserved] = useState(false);
  const [isSticky] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { items } = useCartStore((state) => state);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(
    null
  );
  const [shareableLink, setShareableLink] = useState<string>("");

  const handleRequestClick = (menuItem: any) => {
    // Transform menu item to PackageItem format
    const packageData: PackageItem = {
      id: menuItem.id || menuItem._id,
      brand: businessInfo.name,
      businessCategory: normalizedCategory.toLowerCase(),
      description: menuItem.description || `Delicious ${menuItem.title}`,
      image: menuItem.image,
      package: menuItem.title,
      price:
        typeof menuItem.price === "number"
          ? menuItem.price
          : parseFloat(menuItem.price),
      restaurantId: businessId || "",
      menuId: menuItem.id,
      currency:
        menuItem.currency || businessInfo.paymentInfo?.paymentCurrency || "NGN",
      category: menuItem.category,
    };

    setSelectedPackage(packageData);
    setShowRequestForm(true);
  };

  const handleCloseForm = () => {
    setShowRequestForm(false);
    setSelectedPackage(null);
  };

  const handleFormSuccess = (link: string) => {
    setShareableLink(link);
    setShowRequestForm(false);
    setShowRequestModal(true);
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
    setSelectedPackage(null);
    setShareableLink("");
  };

  // Validate and normalize category - default to "Restaurant" if not provided
  const normalizeCategoryName = (cat: string | null): BusinessCategory => {
    if (!cat) return "restaurant" as BusinessCategory;

    const categoryMap: Record<string, BusinessCategory> = {
      restaurant: "restaurant",
      groceries: "groceries",
      frozenfoods: "frozen-foods",
      "frozen-foods": "frozen-foods",
      winedrinks: "wine-drinks",
      "wine&drinks": "wine-drinks",
      "wine-drinks": "wine-drinks",
    };

    const normalized = categoryMap[cat.toLowerCase()];
    if (normalized) {
      return normalized as BusinessCategory;
    }

    // If not found in map, try capitalizing first letter as fallback
    const fallback = (cat.charAt(0).toUpperCase() +
      cat.slice(1)) as BusinessCategory;
    console.warn(
      `Category "${cat}" not found in map. Using fallback: "${fallback}"`
    );
    return fallback;
  };

  const normalizedCategory = normalizeCategoryName(category);

  // Debug log
  console.log(
    "RestaurantProfilePage - category:",
    category,
    "normalized:",
    normalizedCategory
  );

  // Favorite & Rating hooks (must be called unconditionally)
  const { data: favoriteData, isLoading: isFavoriteLoading } =
    useFavoriteStatus(businessId || "", normalizedCategory);
  const toggleFavoriteMutation = useToggleFavorite();
  const { data: userRatingData } = useUserRating(
    businessId || "",
    normalizedCategory
  );
  const rateRestaurantMutation = useRateRestaurant();

  useEffect(() => {
    if (
      toggleFavoriteMutation.isSuccess &&
      toggleFavoriteMutation.data?.isFavorite
    ) {
      setShowConfetti(true);
    }
  }, [
    toggleFavoriteMutation.isSuccess,
    toggleFavoriteMutation.data?.isFavorite,
  ]);

  // Debounced search effect
  useEffect(() => {
    const debouncedUpdateSearch = debounce(
      (query: string, type: "general" | "reserved") => {
        setDebouncedSearchQuery(query);
        setIsSearchingReserved(type === "reserved" && query.trim().length > 0);
      },
      300
    );

    debouncedUpdateSearch(searchQuery, searchType);

    return () => {
      if (debouncedUpdateSearch.clear) {
        debouncedUpdateSearch.clear();
      }
    };
  }, [searchQuery, searchType]);

  if (
    !normalizedCategory ||
    !["restaurant", "groceries", "frozen-foods", "wine-drinks"].includes(
      normalizedCategory
    )
  ) {
    console.error("Invalid or missing category:", {
      category,
      normalizedCategory,
    });
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Category
          </h2>
          <p className="text-gray-500 mb-4">
            The category "{category || normalizedCategory || "unknown"}" is not
            supported.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const labels = getCategoryLabels(normalizedCategory);
  const queryHooks = getQueryHooks(normalizedCategory);

  const isFavorite = favoriteData?.isFavorite || false;
  // Fetch business data using dynamic hooks
  const {
    data: businessData,
    isLoading,
    error,
    isError,
  } = queryHooks.useDetailQuery(businessId || "", {
    enabled: !!businessId,
  });

  console.log("Query Hook Result:", {
    businessId,
    enabled: !!businessId,
    isLoading,
    isError,
    error: error?.message,
    businessData,
    hasData: !!businessData,
  });

  // Fetch business menus
  const { data: businessMenus } = queryHooks.useMenusQuery(businessId || "", {
    enabled: !!businessId,
  });

  console.log("business menu" + businessMenus);

  // Fetch popular menus
  const {
    data: popularMenus,
    isLoading: isPopularMenusLoading,
    isError: isPopularMenusError,
  } = queryHooks.usePopularMenusQuery(businessId || "", {
    enabled: !!businessId,
  });

  // Fetch reserved menus when search is active
  const {
    data: reservedMenus,
    isLoading: isReservedMenusLoading,
    isError: isReservedMenusError,
  } = queryHooks.useReservedMenuQuery(
    isSearchingReserved && !!businessId && !!debouncedSearchQuery
      ? businessId
      : "",
    debouncedSearchQuery
  );

  // Debug logging
  console.log("RestaurantProfilePage - Business Data State:", {
    businessId,
    category,
    normalizedCategory,
    isLoading,
    isFavorite,
    isError,
    error: error?.message,
    businessData,
    hasData: !!businessData,
  });

  // Handle loading state
  if (isLoading || !businessData) {
    return <MealDetailsSkeleton />;
  }

  // Handle error state - only show error if there was an actual error
  if (isError && !businessData) {
    console.error("RestaurantProfilePage - Error or no data:", {
      isError,
      businessData,
      error,
    });
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {labels.businessType} Not Found
          </h2>
          <p className="text-gray-500 mb-4">
            {error instanceof Error
              ? error.message.includes("404") ||
                error.message.includes("not found")
                ? `The ${labels.businessType.toLowerCase()} you're looking for doesn't exist or has been removed.`
                : error.message.includes("authentication")
                ? "Please log in to view details."
                : `Unable to load ${labels.businessType.toLowerCase()} information.`
              : `The ${labels.businessType.toLowerCase()} you're looking for doesn't exist or has been removed.`}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Extract business data from the API response
  // businessData is already unwrapped from response.data by the service
  const businessDataContent = businessData || {};

  // Handle menu items from business data or separate menu query
  const menuItemsFromBusiness = businessDataContent?.menus || [];

  // Transform popular menus data
  const popularMenuItems = (popularMenus?.data ?? []).map((item: any) => ({
    id: item._id || item.id,
    title: item.name || "Unknown Item",
    price: item.price ?? "Price not available",
    currency:
      item.business?.paymentCurrency ||
      item.restaurant?.paymentCurrency ||
      "NGN",
    image:
      Array.isArray(item.images) && item.images.length > 0
        ? item.images[0]
        : item.profileImage || item.image || refuel,
    menuId: item.menuId || "",
    description: item.description || "",
    isAvailable: item.isAvailable !== false,
    type: item.type || "",
  }));

  // Normalize menus source so downstream code can safely use .filter/.map
  const menusSource: any[] =
    (Array.isArray(businessMenus)
      ? businessMenus
      : (businessMenus as any)?.data) ||
    menuItemsFromBusiness ||
    [];

  // Filtered items based on search type and query
  const filteredItems = (() => {
    if (
      searchType === "reserved" &&
      searchQuery.trim() &&
      reservedMenus &&
      Array.isArray(reservedMenus)
    ) {
      const q = searchQuery.toLowerCase();
      return reservedMenus.filter((item: any) => {
        const name = (item.name || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const resCode = String(
          item.reservationCode || item.reservation || ""
        ).toLowerCase();

        return resCode.includes(q) || name.includes(q) || desc.includes(q);
      });
    }

    return menusSource.filter((item: any) => {
      if (!searchQuery) return true;
      const name = item.name || "";
      const desc = item.description || "";
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  })();

  console.log("sjnkjdnjdbjh" + filteredItems);

  // Transform API business data to component format
  const businessInfo = {
    id:
      businessDataContent.businessId ||
      businessDataContent._id ||
      businessDataContent.id ||
      businessId,
    name: businessDataContent.name || labels.businessType,
    description:
      businessDataContent.description ||
      `${labels.businessType} description not available`,
    address:
      businessDataContent.address ||
      `${businessDataContent.city || ""}, ${businessDataContent.state || ""}, ${
        businessDataContent.country || ""
      }`.replace(/^,\s*|,\s*$/g, "") ||
      "Address not available",
    phone: businessDataContent.phone || "",
    email: businessDataContent.email || "",
    city: businessDataContent.city || "",
    state: businessDataContent.state || "",
    country: businessDataContent.country || "",
    openingHours: businessDataContent.openingHours || "9:00 AM",
    closingHours: businessDataContent.closingHours || "10:00 PM",
    averageRating: businessDataContent.averageRating || "",
    banner:
      businessDataContent.profileImage || businessDataContent.image || " ",
    rating: businessDataContent.totalRatings?.toString() || "4",
    categories: Array.isArray(businessDataContent.cuisineType)
      ? businessDataContent.cuisineType
      : businessDataContent.cuisineType
      ? [businessDataContent.cuisineType]
      : Array.isArray(businessDataContent.category)
      ? businessDataContent.category
      : businessDataContent.category
      ? [businessDataContent.category]
      : ["General"],
    deliveryTime: "20-30 min",
    image:
      businessDataContent.profileImage || businessDataContent.image || refuel,
    priceRange: businessDataContent.priceRange || "₦2000 - ₦20,000",
    isActive: businessDataContent.isActive !== false,
    paymentInfo: businessDataContent.paymentInfo || null,
    isFavourite: businessDataContent.isFavourite || false,
    kitchenType: businessDataContent.kitchenType || "",
  };

  // Helper function to check if business is currently open
  const isBusinessOpen = (openingHours: any, closingHours: any) => {
    if (!openingHours || !closingHours) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const parseTime = (timeStr: any) => {
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      let hour24 = hours;
      if (period === "PM" && hours !== 12) hour24 += 12;
      if (period === "AM" && hours === 12) hour24 = 0;

      return hour24 * 60 + minutes;
    };

    const openTime = parseTime(openingHours);
    const closeTime = parseTime(closingHours);

    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const isCurrentlyOpen = isBusinessOpen(
    businessInfo.openingHours,
    businessInfo.closingHours
  );

  // Handlers for favorite and rating
  const handleToggleFavorite = () => {
    console.log("handleToggleFavorite called:", {
      businessId,
      normalizedCategory,
      isFavoriteLoading,
      isPending: toggleFavoriteMutation.isPending,
      restaurantId, // from useParams
    });

    if (!businessId) {
      console.error("Cannot toggle favorite: businessId is missing");
      return;
    }

    if (businessId && !isFavoriteLoading && !toggleFavoriteMutation.isPending) {
      toggleFavoriteMutation.mutate({
        businessId,
        category: normalizedCategory,
      });
    }
  };

  const handleRateBusiness = (rating: number, comment?: string) => {
    if (businessId) {
      rateRestaurantMutation.mutate({
        restaurantId: businessId,
        ratingData: { rating, comment },
        category: normalizedCategory,
      });
      setIsRatingModalOpen(false);
    }
  };

  const handleOpenRatingModal = () => {
    setIsRatingModalOpen(true);
  };

  return (
    <>
      <div className="relative font-roboto">
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            tweenDuration={5000}
            onConfettiComplete={() => setShowConfetti(false)}
            colors={["#FFCE6D", "#FF7A00", "#FFFFFF", "#FBBF24"]}
          />
        )}

        {/* Hero Image Section */}
        <div className="relative w-full h-64 md:block hidden">
          <NotchAreaHeader
            imageUrl={businessInfo.banner}
            imageAlt={`${businessInfo.name}`}
          >
            <div className="flex justify-between mt-5">
              <button
                className="p-4 bg-white rounded-xl"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="w-[24px]" />
              </button>
              <button
                className={`p-4 rounded-xl cursor-pointer transition-all duration-200 bg-white hover:bg-gray-50`}
                onClick={handleToggleFavorite}
                disabled={toggleFavoriteMutation.isPending}
              >
                <Heart
                  className={`transition-colors duration-200 ${
                    isFavorite ? "text-[#ff0000]" : "text-gray-500"
                  } w-6`}
                  fill={isFavorite ? "#ff0000" : "none"}
                />
              </button>
            </div>
          </NotchAreaHeader>
        </div>

        {/* Business Info Section */}
        <div className="px-4 py-6 flex flex-col">
          <div>
            {/* Category Badge */}
            <div className="mb-3 inline-block">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full border border-blue-200">
                {labels.businessType}
              </span>
            </div>

            <p className="text-gray-400 capitalize">
              {businessInfo.categories.join(", ")}
              {Array.isArray(businessDataContent?.kitchenType)
                ? businessDataContent.kitchenType.map(
                    (type: string, idx: number) => (
                      <span
                        key={type + idx}
                        className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                      >
                        {type}
                      </span>
                    )
                  )
                : businessDataContent?.kitchenType && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {businessDataContent.kitchenType}
                    </span>
                  )}
            </p>
            <h1 className="font-bold text-4xl text-black capitalize inline-flex items-center text-pretty">
              <span className="text-pretty items-center inline-flex">
                {businessInfo.name}
                {hasBadges(businessData || "") && (
                  <span className="relative inline-flex items-center">
                    {renderBadges(businessData || "")}
                  </span>
                )}
              </span>
            </h1>
          </div>

          <div className="inline-flex items-center gap-2 text-xl py-2 flex-wrap">
            <button
              onClick={handleOpenRatingModal}
              className="inline-flex items-center gap-1 hover:bg-gray-100 rounded-lg p-1"
            >
              <Star fill="inherit" /> <span>{businessInfo.averageRating}</span>
            </button>
            {businessInfo.rating !== 0 && (
              <button
                className="underline font-medium inline-flex items-center cursor-pointer"
                onClick={() =>
                  navigate(
                    normalizedCategory === "restaurant"
                      ? `/restaurants/${businessId}/ratings`
                      : `/${normalizedCategory.toLowerCase()}/${businessId}/ratings`
                  )
                }
              >
                {`${businessInfo.rating} ${
                  businessInfo.rating > 1000 ? "k ratings" : "ratings"
                }`}
              </button>
            )}
            <span className="font-normal font-mf">{businessInfo.address}</span>
          </div>

          <div className="pt-2 mb-6 text-start flex flex-col items-start">
            <span
              className={isCurrentlyOpen ? "text-[#34C759]" : "text-red-500"}
            >
              {isCurrentlyOpen ? "Open Now" : "Closed"}
            </span>
            {businessInfo.openingHours && businessInfo.closingHours && (
              <span className="text-gray-500 text-sm">
                {businessInfo.openingHours} - {businessInfo.closingHours}
              </span>
            )}
          </div>

          {normalizedCategory === "restaurant" && (
            <div className="flex gap-3 w-full justify-start">
              <button className="border border-[#FFCE6D] rounded-full p-3 inline-flex md:gap-2 w-fit items-center">
                <User className="text-[#FF7A00]" />
                <span className="text-[#FF7A00] w-full md:w-fit text-sm">
                  Sponsor a person
                </span>
              </button>
              <button className="border border-[#FFCE6D] rounded-full p-3 inline-flex md:gap-2 w-fit items-center">
                <Users className="text-[#FF7A00]" />
                <span className="text-[#FF7A00] w-full md:w-fit text-sm">
                  Sponsor a group
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="px-4 py-2">
          <form
            className="relative"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="text"
              placeholder={
                searchType === "reserved"
                  ? `${labels.reservedPlaceholder} ${businessInfo.name}`
                  : `${labels.searchPlaceholder} ${businessInfo.name}`
              }
              className={`w-full rounded-full py-4 px-12 pr-16 text-lg border transition-colors duration-200 ${
                searchType === "reserved"
                  ? "bg-[#F0E6FF] border-[#D4C5E4]"
                  : "bg-[#ECE6F0] border-[#ECE6F0]"
              }`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F]" />

            <button
              type="button"
              onClick={() => {
                setSearchType(
                  searchType === "general" ? "reserved" : "general"
                );
                setSearchQuery("");
              }}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#D4C5E4] transition-colors duration-200 group"
              title={
                searchType === "general"
                  ? "Switch to Reserved Ticket Search"
                  : "Switch to General Search"
              }
            >
              {searchType === "general" ? (
                <Soup className="h-6 w-6 text-[#49454F] group-hover:text-primary" />
              ) : (
                <Utensils className="h-6 w-6 text-[#49454F] group-hover:text-primary" />
              )}
            </button>

            {searchQuery && (
              <X
                className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F] cursor-pointer"
                onClick={() => setSearchQuery("")}
              />
            )}
          </form>
        </div>

        <div ref={sentinelRef} />

        {/* Search Results or Tabs */}
        {searchQuery.trim() ? (
          <div className={`pb-2 ${isSticky ? "" : "px-4 pt-4"}`}>
            <div
              className={`z-40 ${
                isSticky ? "sticky top-0 bg-white shadow-lg" : ""
              }`}
            >
              {isSticky && (
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1 rounded-md hover:bg-gray-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-md font-semibold mx-2 truncate">
                    {businessInfo.name}
                  </h2>
                  <button
                    className="p-1 rounded-md hover:bg-gray-100"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={20} />
                  </button>
                </div>
              )}

              <div
                className={`flex border-b border-gray-300 bg-[#FEF7FF] justify-center ${
                  isSticky ? "px-4" : ""
                }`}
              >
                <div className="py-4 border-b-2 border-primary text-[#1D1B20] font-medium font-mf tracking-tight">
                  {searchType === "reserved"
                    ? "Reserved Ticket Search Results"
                    : "General Search Results"}
                </div>
              </div>
            </div>

            <div className={`py-4 ${isSticky ? "px-4" : ""}`}>
              {searchType === "reserved" &&
                searchQuery.trim() &&
                isReservedMenusLoading && (
                  <p className="text-center py-8 text-gray-500">
                    Searching for reserved tickets...
                  </p>
                )}

              {searchType === "reserved" &&
                searchQuery.trim() &&
                isReservedMenusError && (
                  <p className="text-center py-8 text-gray-400 text-xs">
                    Failed to search reserved tickets. Showing menu results
                    instead.
                  </p>
                )}

              <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                {searchType === "reserved" &&
                searchQuery.trim() &&
                isReservedMenusLoading ? (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    Searching for reserved tickets...
                  </div>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((items: any, key: number) => (
                    <SignatureBowelCard
                      key={key}
                      restaurantID={`${businessId}`}
                      title={items.name}
                      description={items.description}
                      price={items.price}
                      currency={
                        items.currency ||
                        businessInfo.paymentInfo?.paymentCurrency ||
                        "NGN"
                      }
                      image={
                        Array.isArray(items.images)
                          ? items.images[0]
                          : items.image || refuel
                      }
                      handleClick={() => {
                        console.log("item id " + items._id);
                        navigate(
                          normalizedCategory === "restaurant"
                            ? `/restaurants/${businessId}/meals/${items._id}`
                            : `/${normalizedCategory.toLowerCase()}/${businessId}/items/${
                                items._id
                              }`
                        );
                      }}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    {searchType === "reserved"
                      ? `No reserved tickets found for "${searchQuery}"`
                      : `${labels.noItemsMessage} for "${searchQuery}"`}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <Tabs.Root
            tabIndex={-1}
            defaultValue="tab1"
            activationMode="manual"
            className={`pb-2 ${isSticky ? "" : "px-4 pt-4"}`}
          >
            <div
              className={`z-40 ${
                isSticky ? "sticky top-0 bg-white shadow-lg" : ""
              }`}
            >
              {isSticky && (
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200">
                  <button
                    onClick={() => navigate(-1)}
                    className="p-1 rounded-md hover:bg-gray-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h2 className="text-md font-semibold mx-2 truncate">
                    {businessInfo.name}
                  </h2>
                  <button className="p-1 rounded-md hover:bg-gray-100">
                    <Search size={20} />
                  </button>
                </div>
              )}

              <Tabs.List
                tabIndex={-1}
                className={`flex border-b border-gray-300 bg-[#FEF7FF] justify-evenly ${
                  isSticky ? "px-4" : ""
                }`}
              >
                <Tabs.Trigger
                  tabIndex={-1}
                  value="tab1"
                  className="py-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-[#1D1B20] hover:text-primary font-medium font-mf tracking-tight"
                >
                  {labels.popularTab}
                </Tabs.Trigger>
                <Tabs.Trigger
                  tabIndex={-1}
                  value="tab2"
                  className="py-4 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-[#1D1B20] hover:text-primary font-medium font-mf tracking-tight"
                >
                  {labels.signatureTab}
                </Tabs.Trigger>
              </Tabs.List>
            </div>

            <Tabs.Content
              tabIndex={-1}
              value="tab1"
              className={`py-4 ${isSticky ? "px-4" : ""}`}
            >
              {isPopularMenusLoading && (
                <p className="text-center">Loading {labels.popularTab}...</p>
              )}
              {isPopularMenusError && (
                <p className="text-gray-500">Failed to load popular items.</p>
              )}
              {popularMenuItems && popularMenuItems.length > 0 ? (
                <>
                  <Heading title={labels.popularTab} />
                  <div className="mt-2">
                    <div className="mt-2 max-h-[600px] overflow-y-auto">
                      <div className="flex flex-col gap-4">
                        {popularMenuItems.map((item: any) => (
                          <MenuCard
                            key={item.id}
                            item={{ ...item, id: String(item.id) }}
                            restaurantId={businessId}
                            restaurantName={businessInfo.name}
                            businessCategory={normalizedCategory.toLowerCase()}
                            onRequestClick={handleRequestClick}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center">{labels.noPopularMessage}</p>
              )}
            </Tabs.Content>

            <Tabs.Content
              value="tab2"
              className={`py-4 ${isSticky ? "px-4" : ""}`}
            >
              <Heading title={labels.signatureTab} />

              <div className="py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                {(businessMenus || menuItemsFromBusiness).length > 0 ? (
                  (businessMenus || menuItemsFromBusiness).map(
                    (items: any, key: number) => (
                      <SignatureBowelCard
                        key={key}
                        restaurantID={`${businessId}`}
                        title={items.name}
                        description={items.description}
                        price={items.price}
                        currency={
                          items.currency ||
                          businessInfo.paymentInfo?.paymentCurrency ||
                          "NGN"
                        }
                        image={
                          Array.isArray(items.images)
                            ? items.images[0]
                            : items.image || refuel
                        }
                        handleClick={() => {
                          console.log("item is " + items._id);
                          navigate(
                            normalizedCategory === "restaurant"
                              ? `/restaurants/${businessId}/meals/${items._id}`
                              : `/${normalizedCategory.toLowerCase()}/${businessId}/items/${
                                  items._id
                                }`
                          );
                        }}
                      />
                    )
                  )
                ) : (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    {labels.noSignatureMessage}
                  </div>
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        )}

        {items.length > 0 && (
          <Link
            to={
              normalizedCategory === "restaurant"
                ? `/restaurants/${businessId}/orders`
                : `/${normalizedCategory.toLowerCase()}/${businessId}/orders`
            }
            className="mx-6 fixed bottom-4 left-0 right-0 z-50 flex justify-center md:relative"
          >
            <CartButton text="View Order" isValid={items.length > 0} />
          </Link>
        )}

        <RatingModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onSubmit={handleRateBusiness}
          restaurantName={businessInfo.name}
          initialRating={userRatingData?.data?.rating || 0}
          initialComment={userRatingData?.data?.comment || ""}
          isSubmitting={rateRestaurantMutation.isPending}
        />
      </div>

      {/* Request Form (First Layer) */}
      {selectedPackage && (
        <RequestPackageForm
          isOpen={showRequestForm}
          onClose={handleCloseForm}
          packageData={selectedPackage}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Request Modal (Second Layer - Sharing) */}
      {selectedPackage && shareableLink && (
        <RequestPackageModal
          isOpen={showRequestModal}
          onClose={handleCloseModal}
          packageData={selectedPackage}
          shareableLink={shareableLink}
        />
      )}
    </>
  );
};

export default BusinessProfilePage;
