/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from "react";
import useAuthStore from "@/store/authStore";
// import useLocationStore from "@/store/locationStore"
import {
  AlertCircle,
  ChevronLeft,
  Navigation,
  // Eye,
  // EyeOff,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Declare global variables for Google Maps API
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

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
const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  }
  return `${distanceInKm.toFixed(1)}km`;
};

// Load Google Maps script dynamically
const loadGoogleMapsScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.gomaps.pro"]'
    );
    if (existingScript) {
      const checkGoogle = () => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://maps.gomaps.pro/maps/api/js?key=AlzaSyhN7Sq0yUmDdeQNUZZnlBjW6Dy_G326-Pc&callback=initMap&libraries=geometry";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
};

// Custom marker creation utility
const createCustomMarker = (
  map: any,
  position: { lat: number; lng: number },
  title: string,
  iconColor: string,
  iconType: "user" | "restaurant"
): any => {
  // Add marker drop animation for better UX


  const iconSvg =
    iconType === "user"
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`;

  // Add marker with drop animation and padding
  const marker = new window.google.maps.Marker({
    position,
    map,
    title,
    icon: {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect x="0" y="0" width="36" height="36" rx="18" fill="none" />
            <g transform="translate(2,2)">
              <path fill="${iconColor}" stroke="rgba(0,0,0,0.2)" stroke-width="1" d="M16 0C10.5 0 6 4.5 6 10c0 7 10 26 10 26s10-19 10-26c0-5.5-4.5-10-10-10z"/>
              <g transform="translate(4, 4)">
                ${iconSvg}
              </g>
            </g>
          </g>
        </svg>
      `)}`,
      scaledSize: new window.google.maps.Size(36, 36),
      anchor: new window.google.maps.Point(18, 36),
 
    },

  });

  return marker;
};

const PwaMap: React.FC<MapProps> = ({
  userLocation,
  restaurantLocation,
  restaurantName = "Restaurant",
  restaurantAddress = "Address not available",
  showRoute = true,
  className = "h-screen w-full",
  onError,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsServiceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const restaurantMarkerRef = useRef<any>(null);
  const directLineRef = useRef<any>(null);
  const userInfoWindowRef = useRef<any>(null);
  const restaurantInfoWindowRef = useRef<any>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Get restaurant info from location state if available
  const stateRestaurantInfo = location.state || {};
  const finalRestaurantName =
    restaurantName || stateRestaurantInfo.restaurantName || "Restaurant";
  const finalRestaurantAddress =
    restaurantAddress ||
    stateRestaurantInfo.restaurantAddress ||
    "Address not available";

  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [routeVisible] = useState(showRoute);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [directDistance, setDirectDistance] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Handle error function
  const handleError = useCallback(
    (errorMsg: string) => {
      setError(errorMsg);
      onError?.(errorMsg);
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    },
    [onError]
  );

  // Handle network status
  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Dynamic zoom based on distance
  const calculateZoom = useCallback(() => {
    if (!window.google?.maps?.geometry?.spherical) return 14;

    const distanceInMeters =
      window.google.maps.geometry.spherical.computeDistanceBetween(
        new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        new window.google.maps.LatLng(
          restaurantLocation.lat,
          restaurantLocation.lng
        )
      );
    const distanceInKm = distanceInMeters / 1000;

    if (distanceInKm < 1) return 16;
    if (distanceInKm < 5) return 14;
    if (distanceInKm < 20) return 12;
    if (distanceInKm < 50) return 10;
    return 8;
  }, [userLocation, restaurantLocation]);

  // Show direct line between points
  const showDirectLine = useCallback(() => {
    if (!googleMapRef.current) return;

    if (directLineRef.current) {
      directLineRef.current.setMap(null);
    }

    if (!routeVisible || offline) {
      directLineRef.current = new window.google.maps.Polyline({
        path: [userLocation, restaurantLocation],
        geodesic: true,
        strokeColor: "#94a3b8",
        strokeOpacity: 0.7,
        strokeWeight: 2,
        strokeDasharray: "5 10",
      });
      directLineRef.current.setMap(googleMapRef.current);
    }
  }, [userLocation, restaurantLocation, routeVisible, offline]);

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    try {
      if (!mapRef.current || !window.google) return;

      // Calculate direct distance using Google's geometry library
      const distanceInMeters =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
          new window.google.maps.LatLng(
            restaurantLocation.lat,
            restaurantLocation.lng
          )
        );
      const distanceInKm = distanceInMeters / 1000;
      const formattedDistance = formatDistance(distanceInKm);
      setDirectDistance(formattedDistance);

      const map = new window.google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: calculateZoom(),
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      googleMapRef.current = map;

      // Initialize directions service and renderer
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer(
        {
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#f59e0b",
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        }
      );

      // Create markers
      userMarkerRef.current = createCustomMarker(
        map,
        userLocation,
        user?.username || "You",
        "#2563eb",
        "user"
      );

      restaurantMarkerRef.current = createCustomMarker(
        map,
        restaurantLocation,
        finalRestaurantName,
        "#f59e0b",
        "restaurant"
      );

      // Create info windows
      userInfoWindowRef.current = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: Inter, sans-serif;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              ${
                user?.photoURL
                  ? `<img src="${user.photoURL || user.profileImage}" alt="${
                      user.username || "User"
                    }" style="width: 32px; height: 32px; border-radius: 50%; border: 1px solid #e5e7eb;" />`
                  : ""
              }
              <div style="font-weight: 600;">${user?.username || "You"}</div>
            </div>
          </div>
        `,
      });

      restaurantInfoWindowRef.current = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; font-family: Inter, sans-serif;">
            <div style="font-weight: 600; color: #f59e0b; margin-bottom: 4px;">
              🍽️ ${finalRestaurantName}
            </div>
            <div style="font-size: 12px; color: #6b7280;">
              <div>${finalRestaurantAddress}</div>
              <div>Lat: ${restaurantLocation.lat.toFixed(6)}</div>
              <div>Lng: ${restaurantLocation.lng.toFixed(6)}</div>
              <div style="margin-top: 4px; color: #2563eb;">
                Distance: ${formattedDistance}
              </div>
            </div>
          </div>
        `,
      });

      // Add click listeners to markers
      userMarkerRef.current.addListener("click", () => {
        restaurantInfoWindowRef.current.close();
        userInfoWindowRef.current.open(map, userMarkerRef.current);
      });

      restaurantMarkerRef.current.addListener("click", () => {
        userInfoWindowRef.current.close();
        restaurantInfoWindowRef.current.open(map, restaurantMarkerRef.current);
      });

      // Fit bounds to show both markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(userLocation);
      bounds.extend(restaurantLocation);
      map.fitBounds(bounds, { padding: 80 });

      // Ensure zoom doesn't exceed calculated zoom
      const listener = window.google.maps.event.addListener(
        map,
        "bounds_changed",
        () => {
          const currentZoom = map.getZoom();
          const maxZoom = calculateZoom();
          if (currentZoom && currentZoom > maxZoom) {
            map.setZoom(maxZoom);
          }
          window.google.maps.event.removeListener(listener);
        }
      );

      setMapLoaded(true);
      setLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      handleError("Failed to initialize map");
    }
  }, [
    userLocation,
    restaurantLocation,
    calculateZoom,
    finalRestaurantName,
    finalRestaurantAddress,
    user,
    handleError,
  ]);

  // Load Google Maps script and initialize map
  useEffect(() => {
    const loadMap = async () => {
      try {
        await loadGoogleMapsScript();
        await initializeMap();
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        handleError(
          "Failed to load map. Please check your internet connection."
        );
      }
    };

    loadMap();
  }, [initializeMap, handleError]);

  // Handle route calculation and display
  const updateRoute = useCallback(async () => {
    if (
      !mapLoaded ||
      !directionsServiceRef.current ||
      !directionsRendererRef.current ||
      offline
    ) {
      return;
    }

    if (routeVisible) {
      try {
        const request = {
          origin: userLocation,
          destination: restaurantLocation,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidTolls: false,
          avoidHighways: false,
        };

        directionsServiceRef.current.route(
          request,
          (result: any, status: any) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              directionsRendererRef.current.setDirections(result);
              directionsRendererRef.current.setMap(googleMapRef.current);

              // Extract route information
              const route = result.routes[0];
              const leg = route.legs[0];
              const distance = (leg.distance.value / 1000).toFixed(1);
              const duration = Math.round(leg.duration.value / 60);

              setRouteInfo({ distance, duration: duration.toString() });
              setError(null);

              // Hide direct line
              if (directLineRef.current) {
                directLineRef.current.setMap(null);
              }
            } else {
              console.error("Directions request failed:", status);
              handleError(
                "Unable to find route. Showing direct distance instead."
              );
              showDirectLine();
            }
          }
        );
      } catch (error) {
        console.error("Error calculating route:", error);
        handleError(
          "Route calculation failed. Showing direct distance instead."
        );
        showDirectLine();
      }
    } else {
      // Hide route
      directionsRendererRef.current.setMap(null);
      setRouteInfo(null);
      showDirectLine();
    }
  }, [
    mapLoaded,
    routeVisible,
    userLocation,
    restaurantLocation,
    offline,
    handleError,
    showDirectLine,
  ]);

  // Update route when route visibility changes
  useEffect(() => {
    updateRoute();
  }, [updateRoute]);

  // const toggleRoute = () => {
  //   const newRouteVisible = !routeVisible;
  //   setRouteVisible(newRouteVisible);
  // };
  return (
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
            <span className="font-medium text-gray-900">
              {routeInfo ? `${routeInfo.distance}km` : directDistance}
            </span>
            {routeInfo && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{routeInfo.duration} min</span>
              </>
            )}
            {!routeVisible && !routeInfo && directDistance && (
              <span className="text-xs text-gray-500 ml-1">(direct)</span>
            )}
          </div>
        </div>
      </div>

      {/* Route Toggle Button */}
      {/* <div className="absolute top-4 right-4 z-[1000]">
        <button
          className={`px-4 py-2 rounded-lg shadow-lg transition-all duration-200 border text-sm font-medium flex items-center gap-2 ${
            routeVisible
              ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          }`}
          onClick={toggleRoute}
          disabled={offline}
          aria-label={routeVisible ? "Hide route" : "Show route"}
        >
          {routeVisible ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
          {routeVisible ? "Hide Route" : "Show Route"}
        </button>
      </div> */}

      {/* Offline Indicator */}
      {offline && (
        <div className="absolute bottom-4 left-4 right-4 bg-orange-100 border border-orange-200 text-orange-800 p-3 rounded-lg shadow-lg z-[1000] flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">
            Offline mode - Limited functionality
          </span>
        </div>
      )}

      {/* Google Maps Container */}
      <div
        ref={mapRef}
        className="h-full w-full"
        aria-label="Interactive map"
      />
    </div>
  );
};

export default PwaMap;
