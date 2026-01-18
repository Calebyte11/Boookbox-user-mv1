import React from "react";
import { Star, MapPin } from "lucide-react";
import type { NightlifeVenue } from "@/services/nightlifeService";

interface NightlifeCardProps {
  venue: NightlifeVenue;
  onClick?: () => void;
  className?: string;
}

const NightlifeCard: React.FC<NightlifeCardProps> = ({
  venue,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-purple-200 to-pink-300 overflow-hidden">
        {venue.image || venue.profileImage ? (
          <img
            src={venue.image || venue.profileImage}
            alt={venue.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-400 to-pink-400">
            <span className="text-4xl">🎊</span>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              venue.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {venue.isActive ? "Open" : "Closed"}
          </span>
        </div>

        {/* Rating */}
        {venue.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">
              {venue.rating}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {venue.name}
        </h3>

        {/* Location */}
        {(venue.address || venue.city) && (
          <div className="flex items-start gap-2 mb-3">
            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-2">
              {venue.address || venue.city}
            </p>
          </div>
        )}

        {/* Price Range */}
        {venue.priceRange && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
              From {venue.priceRange}
            </span>
          </div>
        )}

        {/* Contact Info */}
        {venue.phone && (
          <p className="text-xs text-gray-500 mb-3">
            ☎️ {venue.phone}
          </p>
        )}

        {/* CTA Button */}
        <button className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default NightlifeCard;
