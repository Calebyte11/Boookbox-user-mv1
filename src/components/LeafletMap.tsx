import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import RoutingMachine from "./RoutingMachine";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import useAuthStore from "@/store/authStore";
import { AlertCircle, ChevronLeft, Navigation } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { ClientOnly } from './ClientOnly';
interface MapProps {
  userLocation: { lat: number; lng: number };
  restaurantLocation: { lat: number; lng: number };
  restaurantName?: string;
  restaurantAddress?: string;
  showRoute?: boolean;
  zoom?: number;
  className?: string;
  onError?: (error: string) => void;
}

// Distance calculation utility (Haversine formula)
const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  }
  return `${distanceInKm.toFixed(1)}km`;
};

// Custom marker icons
const createCustomIcon = (color: string, iconType: "user" | "restaurant") => {
  const iconHtml =
    iconType === "user"
      ? `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
           <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
         </svg>
       </div>`
      : `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
           <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/>
         </svg>
       </div>`;

  return L.divIcon({
    html: iconHtml,
    className: "custom-marker-icon",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

// Calculate optimal zoom level based on distance
const calculateOptimalZoom = (distance: number): number => {
  if (distance < 1) return 16;
  if (distance < 5) return 14;
  if (distance < 20) return 12;
  if (distance < 50) return 10;
  return 8;
};

const LeafletMap: React.FC<MapProps> = ({
  userLocation,
  restaurantLocation,
  restaurantName = "Restaurant",
  restaurantAddress = "Address not available",
  showRoute = true,
  className = "h-screen w-full",
  //   onError,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  // Get restaurant info from location state if available
  const stateRestaurantInfo = location.state || {};
  const finalRestaurantName =
    restaurantName || stateRestaurantInfo.restaurantName || "Restaurant";
  const finalRestaurantAddress =
    restaurantAddress ||
    stateRestaurantInfo.restaurantAddress ||
    "Address not available";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [directDistance, setDirectDistance] = useState<string | null>(null);

  // Handle error function
  //   const handleError = useCallback(
  //     (errorMsg: string) => {
  //       setError(errorMsg);
  //       onError?.(errorMsg);
  //       // Auto-clear error after 5 seconds
  //       setTimeout(() => setError(null), 5000);
  //     },
  //     [onError]
  //   );

  // Calculate distance on component mount
  useEffect(() => {
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      restaurantLocation.lat,
      restaurantLocation.lng
    );
    setDirectDistance(formatDistance(distance));
    setLoading(false);
  }, [userLocation, restaurantLocation]);

  // Calculate center point and zoom
  const centerLat = (userLocation.lat + restaurantLocation.lat) / 2;
  const centerLng = (userLocation.lng + restaurantLocation.lng) / 2;
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    restaurantLocation.lat,
    restaurantLocation.lng
  );
  const zoom = calculateOptimalZoom(distance);

  // Create user info popup content as HTML string
  const createUserPopupContent = () => {
    const isOrganization =
      user?.role === "organization" || user?.accountType === "organization";
    const photo = user?.photoURL || user?.profileImage;
    const name = isOrganization
      ? user?.organizationName || user?.fullName || "Organization"
      : user?.fullName || user?.username || "User";
    const type = isOrganization ? "Organization" : "Individual";
    const email = user?.email
      ? `<div style='display:flex;align-items:center;gap:6px;font-size:14px;'><svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><path d='M4 4h16v16H4z' fill='#fff'/><path d='M22 6l-10 7L2 6' stroke='#6b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg><span>${user.email}</span></div>`
      : "";
    const phone =
      user?.phoneNumber || user?.phone
        ? `<div style='display:flex;align-items:center;gap:6px;font-size:14px;'><svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><path d='M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 21 16.91z'/></svg><span>${
            user.phoneNumber || user.phone
          }</span></div>`
        : "";
    const address = user?.address
      ? `<div style='display:flex;align-items:flex-start;gap:6px;font-size:14px;'><svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><path d='M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg><div><div>${
          user.address
        }</div>${
          user?.city || user?.state
            ? `<div style='font-size:12px;color:#6b7280;'>${[
                user.city,
                user.state,
                user.country,
              ]
                .filter(Boolean)
                .join(", ")}</div>`
            : ""
        }</div></div>`
      : "";
    const contactEmail =
      isOrganization && user?.contactEmail && user.contactEmail !== user.email
        ? `<div style='display:flex;align-items:center;gap:6px;font-size:14px;'><svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><path d='M4 4h16v16H4z' fill='#fff'/><path d='M22 6l-10 7L2 6' stroke='#6b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg><span>${user.contactEmail}</span><span style='font-size:12px;color:#6b7280;'>(Contact)</span></div>`
        : "";
    // const birthday =
    //   !isOrganization && user?.birthday
    //     ? `<div style='display:flex;align-items:center;gap:6px;font-size:14px;'><svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><rect x='3' y='4' width='18' height='18' rx='2'/><path d='M16 2v4M8 2v4M3 10h18'/></svg><span>${
    //         user.birthday.day && user.birthday.month
    //           ? `${user.birthday.day} ${user.birthday.month}`
    //           : ""
    //       }${user.birthday.year ? ` ${user.birthday.year}` : ""}</span></div>`
    //     : "";
    const verified = user?.isVerified ? "✓ Verified" : "Unverified";
    return `
      <div style='padding:12px;min-width:280px;max-width:320px;font-family:Inter,sans-serif;'>
        <div style='display:flex;align-items:center;gap:12px;margin-bottom:12px;'>
          ${
            photo
              ? `<img src='${photo}' alt='${name}' style='width:48px;height:48px;border-radius:50%;border:2px solid #bfdbfe;object-fit:cover;'/>`
              : `<div style='width:48px;height:48px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;'>${
                  isOrganization ? "🏢" : "👤"
                }</div>`
          }
          <div>
            <div style='font-weight:600;color:#111827;font-size:16px;'>${name}</div>
            <span style='font-size:12px;color:#2563eb;background:#eff6ff;padding:2px 8px;border-radius:8px;'>${type}</span>
          </div>
        </div>
        ${email}
        ${phone}
        ${address}
        ${contactEmail}
       
        <div style='margin-top:12px;padding-top:8px;border-top:1px solid #f3f4f6;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#6b7280;'>
          <span>Your Location</span>
          <span>${verified}</span>
        </div>
      </div>
    `;
  };

  // Create restaurant popup content as HTML string
  const createRestaurantPopupContent = () => `
    <div style='padding:12px;min-width:250px;font-family:Inter,sans-serif;'>
      <div style='display:flex;align-items:center;gap:12px;margin-bottom:12px;'>
        <div style='width:48px;height:48px;border-radius:50%;background:#fef3c7;display:flex;align-items:center;justify-content:center;'>🍽️</div>
        <div>
          <div style='font-weight:600;color:#111827;font-size:16px;'>${finalRestaurantName}</div>
          <span style='font-size:12px;color:#f59e0b;background:#fef3c7;padding:2px 8px;border-radius:8px;'>Restaurant</span>
        </div>
      </div>
      <div style='display:flex;align-items:flex-start;gap:6px;font-size:14px;margin-bottom:6px;'>
        <svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><path d='M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z'/><circle cx='12' cy='10' r='3'/></svg>
        <span>${finalRestaurantAddress}</span>
      </div>
      <div style='display:flex;align-items:center;gap:6px;font-size:14px;'>
        <svg width='16' height='16' fill='none' stroke='#6b7280' stroke-width='2' viewBox='0 0 24 24'><path d='M3 12h18M12 3v18'/></svg>
        <span>Distance: <span style='font-weight:500;color:#2563eb;'>${directDistance}</span></span>
      </div>
      <div style='margin-top:12px;padding-top:8px;border-top:1px solid #f3f4f6;font-size:12px;color:#6b7280;'>
        Lat: ${restaurantLocation.lat.toFixed(
          6
        )}, Lng: ${restaurantLocation.lng.toFixed(6)}
      </div>
    </div>
  `;

  return (
<ClientOnly>
    <div
      className={`${className} relative`}
      role="region"
      aria-label="Map showing user and restaurant locations"
    >
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-[1000]">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
            <p className="text-lg font-medium text-gray-700">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg shadow-lg z-[1000] flex items-center gap-3">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-amber-600 hover:text-amber-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Back Button */}
      <div className="absolute top-4 left-4 z-[1000]">
        <button
          className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      </div>

      {/* Distance Info Card */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000]">
        <div className="bg-white rounded-lg shadow-lg px-4 py-2 border border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">{directDistance}</span>
            <span className="text-xs text-gray-500">(direct)</span>
          </div>
        </div>
      </div>

      {/* Leaflet Map Container */}
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User Marker */}
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={createCustomIcon("#2563eb", "user")}
        >
          <Popup maxWidth={400} className="custom-popup">
            <div
              dangerouslySetInnerHTML={{ __html: createUserPopupContent() }}
            />
          </Popup>
        </Marker>

        {/* Restaurant Marker */}
        <Marker
          position={[restaurantLocation.lat, restaurantLocation.lng]}
          icon={createCustomIcon("#f59e0b", "restaurant")}
        >
          <Popup maxWidth={350} className="custom-popup">
            <div
              dangerouslySetInnerHTML={{
                __html: createRestaurantPopupContent(),
              }}
            />
          </Popup>
        </Marker>

        {/* Road-following Route */}
        {showRoute && (
          <RoutingMachine
            waypoints={[
              [userLocation.lat, userLocation.lng],
              [restaurantLocation.lat, restaurantLocation.lng],
            ]}
            color="#f59e0b"
          />
        )}
      </MapContainer>

      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 250px;
        }
        .leaflet-popup-tip {
          background: white;
        }
        .custom-marker-icon {
          background: transparent !important;
          border: none !important;
        }
        /* RoutingMachine route/minimap background */
        .leaflet-routing-container {
          background: white !important;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
         /* Add padding to the map container for breathing space */
        .leaflet-container {
          padding: 16px;
        }

      `}</style>
    </div>
    </ClientOnly>
  );
};

export default LeafletMap;
