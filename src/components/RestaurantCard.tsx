import React from "react";
import { Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface RestaurantCardProps {
  id: string;
  title: string;
  image: string;
  rating?: string | number;
  price?: string;
  status?: "active" | "inactive";
  location?: string;
  description?: string;
  className?: string;
  onCardClick?: () => void;
  city?: string;
  state?: string;
  // New props for dynamic behavior
  category?: "restaurant" | "groceries" | "frozenfoods" | "winedrinks" | "foodmarket" | "fruitmarket" | "freemarket" | "bakery" | "confectioneries" | "pharmastores" | "hangouttickets" | "transporttickets" | "giftstores" | "madeinnigeria" | "hospitality" | "nightlife" | "carparkservices" | "vegetablemarket";
  buttonText?: string;
  navigateUrl?: string;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  id,
  title,
  image,
  rating,
  price,
  status,
  location,
  description,
  className = "",
  onCardClick,
  city,
  state,
  category = "restaurant",
  buttonText,
  navigateUrl,
}) => {
  const navigate = useNavigate();

  // Generate dynamic navigation URL based on category
  const getNavigationUrl = () => {
    if (navigateUrl) return navigateUrl;
    
    // Only generate URL if id exists
    if (!id) {
      console.warn("Business ID is missing - cannot generate navigation URL");
      return "#";
    }
    
    // All business types use the same route with category as query param
    // Map category names to query parameter values
    const categoryQueryMap = {
      restaurant: "restaurant",
      groceries: "groceries",
      frozenfoods: "frozenfoods",
      winedrinks: "winedrinks",
      foodmarket: "foodmarket",
      fruitmarket: "fruit-market",
      freemarket: "free-market",
      bakery: "bakery",
      confectioneries: "confectioneries",
      pharmastores: "pharma-stores",
      hangouttickets: "hangout-tickets",
      transporttickets: "transport-tickets",
      giftstores: "gift-stores",
      madeinnigeria: "made-in-nigeria",
      hospitality: "hospitality",
      nightlife: "nightlife",
      carparkservices: "car-park-services",
      vegetablemarket: "vegetable-market",
    };
    
    const categoryParam = categoryQueryMap[category] || "restaurant";
    return `/restaurants/${id}?category=${categoryParam}`;
  };  // Generate dynamic button text based on category
  const getButtonText = () => {
    if (buttonText) return buttonText;

    const categoryButtonTexts = {
      restaurant: "Book a meal",
      groceries: "Order items",
      frozenfoods: "Order items",
      winedrinks: "Order items",
      foodmarket: "Order items",
      fruitmarket: "Order items",
      freemarket: "Order items",
      bakery: "Order items",
      confectioneries: "Order items",
      pharmastores: "Order items",
      hangouttickets: "Book ticket",
      transporttickets: "Book ticket",
      giftstores: "Order items",
      madeinnigeria: "Order items",
      hospitality: "Book a stay",
      nightlife: "Book a venue",
      carparkservices: "Book a spot",
      vegetablemarket: "Order items",
    };

    return categoryButtonTexts[category];
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
      console.log("Card clicked");
    } else {
      navigate(getNavigationUrl());
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 shadow-sm p-2 bg-[#F8F8F8] cursor-pointer rounded-lg transition-all hover:shadow-md ${className}`}
      onClick={handleCardClick}
    >
      <img
        src={image}
        alt={`${title} ${category}`}
        className="rounded-lg object-cover h-32 w-full"
        onError={(e) => {
          // Fallback image if image fails to load
          const target = e.target as HTMLImageElement;
          target.src = "";
        }}
      />
      <div className="flex flex-col gap-1 mt-2">
        <p className="capitalize font-semibold text-sm truncate" title={title}>
          {title}
        </p>
        {price && (
          <p className="font-normal tracking-tight text-sm text-gray-600">
            {price}
          </p>
        )}
        {/* City/State display */}
        {(city || state) && (
          <p className="font-normal tracking-tight text-xs text-gray-500 truncate">
            {city && <span>{city}</span>}
            {city && state && <span>, </span>}
            {state && <span>{state}</span>}
          </p>
        )}
        {location && (
          <p className="font-normal tracking-tight text-xs text-gray-500 truncate">
            {location}
          </p>
        )}
        {description && (
          <p className="font-normal tracking-tight text-xs text-gray-500 line-clamp-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-400 inline-flex items-center text-sm gap-1">
            <Star className="text-black w-4 h-4" fill="currentColor" />
            {rating || 0}
          </span>

          {status && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {status}
            </span>
          )}
        </div>
      </div>
      {id ? (
        <Link
          to={getNavigationUrl()}
          className="bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 inline-flex justify-center transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-center text-sm">{getButtonText()}</span>
          
        </Link>
      ) : (
        <button
          disabled
          className="bg-gray-300 text-gray-500 p-2 rounded-full cursor-not-allowed inline-flex justify-center transition-colors duration-200 mt-auto w-fit"
        >
          <span className="text-center text-sm">{getButtonText()}</span>
        </button>
      )}
    </div>
  );
};

export default RestaurantCard;