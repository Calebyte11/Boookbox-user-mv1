import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation as useRouterLocation } from "react-router-dom";
import { ClientOnly } from "@/components/ClientOnly";

const LeafletMap = lazy(() => import("@/components/LeafletMap"));
import { useLocationService } from "@/hooks/useLocationService";
import {
  calculateDistance,
  getDirection,
  formatDistance,
} from "@/utils/locationUtils";

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationError {
  code: number;
  message: string;
}

const Map = () => {
  const routerLocation = useRouterLocation();
  const {
    position,
    ipLocation,
    isLoading,
    hasLocation,
    error,
    getCurrentLocation,
  } = useLocationService({
    autoRequest: false,
    // showToasts: true,
  });
    const [location, setLocation] = useState<Location | null>(null);
    const [, setError] = useState<LocationError | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    // const { setPosition } = useLocationStore();
  // Get coordinates from best available source (GPS or IP)
  const coordinates =
    position ||
    (ipLocation
      ? {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
        }
      : null);

  // trial - safer location request with iOS safety
  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: "Geolocation is not supported" });
      setLoading(false);
      return;
    }

    // Use safer approach with try-catch and iOS compatibility
    const getLocationSafely = async () => {
      try {
        // Import iOS safe location utility dynamically ONLY
        const { getSafeLocation, isIOSDevice } = await import("@/utils/iosLocationFix");
        
        const result = await getSafeLocation({
          enableHighAccuracy: !isIOSDevice(), // iOS prefers false
          timeout: isIOSDevice() ? 15000 : 10000,
          maximumAge: 300000,
          fallbackToIP: true
        });

        if (result.success && result.position) {
          const newPosition = {
            latitude: result.position.coords.latitude,
            longitude: result.position.coords.longitude,
            accuracy: result.position.coords.accuracy,
            timestamp: result.position.timestamp,
            source: result.source,
          };
          setLocation(newPosition);
          setLoading(false);
        } else {
          setError({ code: 1, message: result.error || "Location unavailable" });
          setLoading(false);
        }
      } catch (err) {
        console.error('Safe location request failed:', err);
        const error = err as Error;
        setError({ code: 1, message: error.message || "Location service failed" });
        setLoading(false);
      }
    };

    // Import and use isIOSDevice to delay location request for iOS devices
    import("@/utils/iosLocationFix").then(({ isIOSDevice }) => {
      if (isIOSDevice()) {
        setTimeout(getLocationSafely, 2000); // 2 second delay for iOS
      } else {
        getLocationSafely();
      }
    }).catch(() => {
      // Fallback if import fails
      getLocationSafely();
    });
  }, []);

  // We have location if we have either GPS or IP location
  const hasAnyLocation = hasLocation || !!ipLocation;


  const restaurantData = routerLocation.state as {
    restaurantLocation?: { lat: number; lng: number };
    restaurantName?: string;
    restaurantAddress?: string;
  } | null;
  const restaurantLocation = restaurantData?.restaurantLocation || {
    lat: 40.73061,
    lng: 33.935242,
  }; // Calculate distance and direction to restaurant if user location is available
  const restaurantInfo = (() => {
    if (location || coordinates) {
      const userLocation = location
      ? { lat: location.latitude, lng: location.longitude }
      : { lat: coordinates!.latitude, lng: coordinates!.longitude };

      const distance = calculateDistance(
        userLocation,
        restaurantLocation,
        "km"
      );
      const direction = getDirection(userLocation, restaurantLocation);
      const formattedDistance = formatDistance(distance, "km");

      return {
        distance,
        direction,
        formattedDistance,
        isNearby: distance <= 5, // Within 5km
      };
    }
    return null;
  })();
  useEffect(() => {
    if (!hasAnyLocation) {
      getCurrentLocation();
    }
  }, [hasAnyLocation, getCurrentLocation]);

  if (isLoading && loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading your location...</p>
        </div>
      </div>
    );
  }
  if (error && !ipLocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error.message}</p>
          <button
            onClick={getCurrentLocation}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="overflow-hidden h-fit !z-10">
      {/* Distance and Direction Info */}
      {restaurantInfo && (
      <div className="absolute top-4 left-4 right-4 z-20 bg-white rounded-lg shadow-lg p-4 mx-4">
        <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
          {restaurantData?.restaurantName || "Restaurant"}
          </h3>
          <p className="text-sm text-gray-600">
          {restaurantInfo.formattedDistance} away •{" "}
          {restaurantInfo.direction}
          </p>
          {restaurantInfo.isNearby && (
          <p className="text-xs text-green-600 font-medium">
            ✓ Nearby location
          </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">
          {restaurantInfo.formattedDistance}
          </p>
          <p className="text-xs text-gray-500">
          {restaurantInfo.direction}
          </p>
        </div>
        </div>
      </div>
      )}
      <ClientOnly
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading Map...</p>
            </div>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Loading Map...</p>
              </div>
            </div>
          }
        >
          <LeafletMap
            userLocation={
              location
                ? { lat: location.latitude, lng: location.longitude }
                : coordinates && hasAnyLocation
                ? { lat: coordinates.latitude, lng: coordinates.longitude }
                : { lat: restaurantLocation.lat, lng: restaurantLocation.lng }
            }
            restaurantLocation={restaurantLocation}
            showRoute={true}
            className="h-screen"
            restaurantAddress={restaurantData?.restaurantAddress || ""}
            restaurantName={restaurantData?.restaurantName || "Restaurant"}
          />
        </Suspense>
      </ClientOnly>
    </div>
  );
};

export default Map;
