import React from "react";
import { Star, MapPin } from "lucide-react";
import type { CarParkingService } from "@/services/carParkingServiceService";

interface CarParkingCardProps {
  service: CarParkingService;
  onClick?: () => void;
  className?: string;
}

const CarParkingCard: React.FC<CarParkingCardProps> = ({
  service,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
        {service.image || service.profileImage ? (
          <img
            src={service.image || service.profileImage}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-300">
            <span className="text-4xl">🅿️</span>
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              service.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {service.isActive ? "Open" : "Closed"}
          </span>
        </div>

        {/* Rating */}
        {service.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm">
            <Star size={14} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-semibold text-gray-700">
              {service.rating}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
          {service.name}
        </h3>

        {/* Location */}
        {(service.address || service.city) && (
          <div className="flex items-start gap-2 mb-3">
            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600 line-clamp-2">
              {service.address || service.city}
            </p>
          </div>
        )}

        {/* Price Range */}
        {service.priceRange && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
              From {service.priceRange}
            </span>
          </div>
        )}

        {/* Contact Info */}
        {service.phone && (
          <p className="text-xs text-gray-500 mb-3">
            ☎️ {service.phone}
          </p>
        )}

        {/* CTA Button */}
        <button className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default CarParkingCard;
