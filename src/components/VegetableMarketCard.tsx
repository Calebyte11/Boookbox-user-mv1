import React from "react";
import { Star, MapPin } from "lucide-react";
import type { VegetableMarket } from "@/services/vegetableMarketService";

interface VegetableMarketCardProps {
  market: VegetableMarket;
  onClick?: () => void;
  className?: string;
}

const VegetableMarketCard: React.FC<VegetableMarketCardProps> = ({
  market,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-green-200 to-emerald-300 overflow-hidden">
        {market.image || market.profileImage ? (
          <img
            src={market.image || market.profileImage}
            alt={market.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-400 to-emerald-400">
            <span className="text-4xl">🥬</span>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              market.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {market.isActive ? "Open" : "Closed"}
          </span>
        </div>

        {/* Rating */}
        {market.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">
              {market.rating}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {market.name}
        </h3>

        {/* Location */}
        {(market.address || market.city) && (
          <div className="flex items-start gap-2 mb-3">
            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-2">
              {market.address || market.city}
            </p>
          </div>
        )}

        {/* Price Range */}
        {market.priceRange && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
              From {market.priceRange}
            </span>
          </div>
        )}

        {/* Contact Info */}
        {market.phone && (
          <p className="text-xs text-gray-500 mb-3">
            ☎️ {market.phone}
          </p>
        )}

        {/* CTA Button */}
        <button className="w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default VegetableMarketCard;
