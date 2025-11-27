import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft, Heart } from "lucide-react";
import NotchAreaHeader from "@/components/NotchAreaHeader";
import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
import { useFavoriteStatus, useToggleFavorite } from "@/hooks/useFavoriteRating";
import sponsorBanner from "@/assets/images/sponsorbanner.png";
import type { RestaurantHeaderProps } from "./types";

type BusinessCategory = "Restaurant" | "Groceries" | "FrozenFoods" | "WineDrinks";


const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ 
  onBackClick 
}) => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [searchParams] = useSearchParams();
  const category = searchParams.get("category");
  
  
  // Normalize category name
  const normalizeCategoryName = (cat: string | null): BusinessCategory => {
    if (!cat) return "Restaurant";
    
    const categoryMap: Record<string, BusinessCategory> = {
      restaurant: "Restaurant",
      groceries: "Groceries",
      frozenfoods: "FrozenFoods",
      "frozen-foods": "FrozenFoods",
      winedrinks: "WineDrinks",
      "wine-drinks": "WineDrinks",
    };
    
    return categoryMap[cat.toLowerCase()] || "Restaurant";
  };
  
  const normalizedCategory = normalizeCategoryName(category);

  // Fetch restaurant data using the authenticated API
  const { data: restaurantData } = useRestaurantDetailQuery(
    restaurantId || "",
    {
      enabled: !!restaurantId,
    }
  );
  
  console.log("🏪 Restaurant Data Loaded:", {
    restaurantId,
    restaurantData,
    isFavoriteInData: restaurantData?.isFavorite,
    hasRestaurantData: !!restaurantData,
  });
  const [localIsFavorite, setLocalIsFavorite] = React.useState<boolean>(
    restaurantData?.isFavorite || false
  );

  // Favorite & Rating hooks - NOW WITH CATEGORY
  const { data: favoriteData, isLoading: isFavoriteLoading } =
    useFavoriteStatus(
      restaurantData?.restaurantId || restaurantId || "", 
      normalizedCategory
    );
  const toggleFavoriteMutation = useToggleFavorite();
  
  // Default back click handler
  const handleBackClick = onBackClick || (() => navigate(-1));
  const isFavorite = favoriteData?.isFavorite || false;

  useEffect(() => {
    if (
      toggleFavoriteMutation.isSuccess &&
      toggleFavoriteMutation.data?.isFavorite
    ) {
      // setShowConfetti(true); // Disabled for now
    }
  }, [
    toggleFavoriteMutation.isSuccess,
    toggleFavoriteMutation.data?.isFavorite,
  ]);

  const handleToggleFavorite = () => {
    const businessId = restaurantData?.restaurantId || restaurantId;
    setLocalIsFavorite(!localIsFavorite);
    console.log("RestaurantHeader - Toggle favorite:", {
      businessId,
      category: normalizedCategory,
      isFavorite,
      restaurantData,
      restaurantId,
    });

    if (businessId && !isFavoriteLoading && !toggleFavoriteMutation.isPending) {
      // FIXED: Pass object with businessId and category
      toggleFavoriteMutation.mutate({ 
        businessId, 
        category: normalizedCategory 
      });
    } else {
      if (!businessId)
        console.log("   - Missing restaurant ID");
      if (isFavoriteLoading)
        console.log("   - Currently loading favorite status");
      if (toggleFavoriteMutation.isPending)
        console.log("   - Toggle mutation already pending");
    }
  };

  return (
    <>
      <NotchAreaHeader
        imageUrl={restaurantData?.profileImage || sponsorBanner}
        imageAlt={restaurantData?.name || "Restaurant"}
      >
        <div className="flex justify-between mt-5">
          <button
            className="p-4 bg-white rounded-xl "
            onClick={handleBackClick}
          >
            <ChevronLeft className="w-[24px]" />
          </button>
          <button
            className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-110 bg-white hover:bg-gray-50"
            `}
            onClick={handleToggleFavorite}
            disabled={toggleFavoriteMutation.isPending}
          >
            <Heart
              className={`transition-all duration-300 ${
                isFavorite ? "text-white" : "text-gray-400"
              } w-[24px]`}
              fill={localIsFavorite ? "#E91E63" : "none"}
              strokeWidth={2}
            />
          </button>
        </div>
      </NotchAreaHeader>
    </>
  );
};

export default RestaurantHeader;