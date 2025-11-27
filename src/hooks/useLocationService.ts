import { useEffect, useCallback, useRef } from "react";
import { useLocationStore } from "@/store/locationStore";
import {
  useIPLocationQuery,
  useReverseGeocodeQuery,
} from "@/services/locationService";
import type { GeolocationPosition } from "@/store/locationStore";

export interface UseLocationOptions { 
  autoRequest?: boolean;
  onLocationUpdate?: (location: {
    lat: number;
    lng: number;
    address: string;
  }) => void;
  onError?: (error: string) => void;
}

// Utility functions
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const isGeolocationSupported = (): boolean => {
  return "geolocation" in navigator;
};

export const useLocationService = (options: UseLocationOptions = {}) => {
  const {
    autoRequest = true,
    onLocationUpdate,
    onError,
  } = options;

  const isInitializedRef = useRef(false);

  // Get all store state and actions
  const {
    // State
    position,
    ipLocation,
    address,
    isLoadingGPS,
    isLoadingIP,
    permissionStatus,
    error,
    showPermissionModal,
    permissionRequestCount,

    // Computed
    displayLocation,
    isLocationFresh,
    accuracyLevel,
    ipCoordinates,
    addressParts,
    ipLocationData,

    // Actions
    setPosition,
    setIpLocation,
    setAddress,
    setIsLoadingGPS,
    setIsLoadingIP,
    setPermissionStatus,
    setError,
    setShowPermissionModal,
    incrementPermissionRequestCount,
    updateFromBestSource,
    clearLocation,
    getBestLocation,
  } = useLocationStore();

  // Use React Query for IP location
  const ipLocationQuery = useIPLocationQuery();
  // Use React Query for reverse geocoding
  const bestLocation = getBestLocation(
    position || undefined,
    ipLocation || undefined
  );
  const reverseGeocodeQuery = useReverseGeocodeQuery(
    bestLocation?.position.latitude || 0,
    bestLocation?.position.longitude || 0,
    !!bestLocation
  ); // Handle IP location query result
  useEffect(() => {
    if (ipLocationQuery.data && !ipLocationQuery.isLoading && !ipLocation) {
      setIpLocation(ipLocationQuery.data);
      setIsLoadingIP(false);

      // Only update from best source if we don't already have this IP data
      updateFromBestSource(position || undefined, ipLocationQuery.data);
    }

    if (ipLocationQuery.isError) {
      console.error("IP location query failed:", ipLocationQuery.error);
      setIsLoadingIP(false);
    }
    if (ipLocationQuery.isLoading && !isLoadingIP) {
      setIsLoadingIP(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ipLocationQuery.data,
    ipLocationQuery.isLoading,
    ipLocationQuery.isError,
    ipLocationQuery.error,
  ]);  // Handle reverse geocoding query result
  useEffect(() => {
    if (
      reverseGeocodeQuery.data &&
      !reverseGeocodeQuery.isLoading &&
      !address
    ) {
      setAddress(reverseGeocodeQuery.data);

      if (onLocationUpdate && bestLocation) {
        onLocationUpdate({
          lat: bestLocation.position.latitude,
          lng: bestLocation.position.longitude,
          address: reverseGeocodeQuery.data.formatted,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reverseGeocodeQuery.data, reverseGeocodeQuery.isLoading]);
  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionStatus("unknown");
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      setPermissionStatus(result.state);

      result.addEventListener("change", () => {
        setPermissionStatus(result.state);
      });
    } catch (error) {
      console.warn("Permission query failed:", error);
      setPermissionStatus("unknown");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Direct GPS location using navigator API
  const getGPSLocation = useCallback(async (): Promise<boolean> => {
    if (!isGeolocationSupported()) {
      console.warn("Geolocation not supported");
      return false;
    }

    if (permissionStatus === "denied") {
      setShowPermissionModal(true);
      return false;
    }

    setIsLoadingGPS(true);
    incrementPermissionRequestCount();

    return new Promise((resolve) => {
      // iOS-specific options
      const options = {
        enableHighAccuracy: true,
        timeout: 15000, // Longer timeout for iOS
        maximumAge: 300000, // 5 minutes cache for iOS
      };

      // iOS Safari needs permission check first
      if ('permissions' in navigator) {
        navigator.permissions.query({name: 'geolocation'})
          .then((result) => {
            if (result.state === 'denied') {
              setError({ 
                code: 1, 
                message: "Location access denied", 
                type: "PERMISSION_DENIED" 
              });
              setPermissionStatus("denied");
              setShowPermissionModal(true);
              setIsLoadingGPS(false);
              resolve(false);
              return;
            }
            
            // Proceed with location request
            requestLocation();
          })
          .catch(() => {
            // Fallback if permissions API not available
            requestLocation();
          });
      } else {
        requestLocation();
      }

      function requestLocation() {
        navigator.geolocation.getCurrentPosition(
          (gpsPosition) => {
            const newPosition: GeolocationPosition = {
              latitude: gpsPosition.coords.latitude,
              longitude: gpsPosition.coords.longitude,
              accuracy: gpsPosition.coords.accuracy,
              timestamp: Date.now(),
              source: "gps",
            };

            console.log("GPS location obtained:", newPosition);
            setError(null);
            setPermissionStatus("granted");
            setIsLoadingGPS(false);
            setPosition(newPosition);
            updateFromBestSource(newPosition, ipLocation || undefined);
            resolve(true);
          },
          (error) => {
            console.error("GPS location error:", error);
            
            // iOS-specific error handling
            let errorType: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";
            let message = error.message;
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorType = "PERMISSION_DENIED";
                message = "Location access denied. Please enable location services in your browser settings.";
                setPermissionStatus("denied");
                setShowPermissionModal(true);
                break;
              case error.POSITION_UNAVAILABLE:
                errorType = "POSITION_UNAVAILABLE";
                message = "Location information unavailable. Please check your GPS signal.";
                break;
              case error.TIMEOUT:
                errorType = "TIMEOUT";
                message = "Location request timed out. Please try again.";
                break;
              default:
                errorType = "UNKNOWN";
                message = "Unknown location error occurred.";
            }

            setError({
              code: error.code,
              message,
              type: errorType,
            });
            
            setIsLoadingGPS(false);
            resolve(false);
          },
          options
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus, incrementPermissionRequestCount, setError, setPermissionStatus, setShowPermissionModal, setIsLoadingGPS, setPosition, updateFromBestSource, ipLocation, onError]);

  // Main actions
  const getCurrentLocation = useCallback(async (): Promise<boolean> => {
    // Always try GPS first
    const gpsSuccess = await getGPSLocation();
    
    if (gpsSuccess) {
      // console.log("Using GPS location (highest priority)");
      return true;
    }

    // Fallback to IP if GPS fails
    // console.log("GPS failed, using IP location as fallback");
    return false; // IP location will be handled automatically by React Query
  }, [getGPSLocation]);
  const refreshLocation = useCallback(async (): Promise<boolean> => {
    clearLocation();
    // Refetch IP location via React Query
    ipLocationQuery.refetch();
    return getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getCurrentLocation, ipLocationQuery]);

  const retryPermission = useCallback(async (): Promise<boolean> => {
    if (permissionStatus === "denied") {
      setShowPermissionModal(true);
      return false;
    }
    return getCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionStatus, getCurrentLocation]);
  // Initialize on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    checkPermissionStatus();

    // IP location will be fetched automatically by React Query
   

    // Auto-request GPS if enabled and no fresh GPS data
    if (autoRequest && (!position || !isLocationFresh)) {
      
      setTimeout(() => {
        getCurrentLocation();
      }, 1000); // Small delay to allow IP location to load first
    } 
   
    
  }, [autoRequest, checkPermissionStatus, getCurrentLocation, isLocationFresh, position]);
  // Get the best available location (GPS has priority over IP)
  const bestAvailableLocation = getBestLocation(position || undefined, ipLocation || undefined);
  
  // Provide coordinates from the best source (GPS prioritized)
  const bestCoordinates = bestAvailableLocation ? {
    latitude: bestAvailableLocation.position.latitude,
    longitude: bestAvailableLocation.position.longitude,
    accuracy: bestAvailableLocation.position.accuracy,
    source: bestAvailableLocation.source,
  } : null;

  // Return all the data and actions consumers expect
  return {
    // Location data - GPS prioritized
    position, // Raw GPS position
    ipLocation, // Raw IP location  
    address,
    displayLocation,
    hasLocation: !!bestAvailableLocation, // True if we have either GPS or IP
    locationSource: bestAvailableLocation?.source || null,

    // Status
    isLoading: isLoadingGPS || isLoadingIP || ipLocationQuery.isLoading,
    isLoadingGPS,
    isLoadingIP: isLoadingIP || ipLocationQuery.isLoading,
    error,
    permissionStatus,

    // Permission modal
    showPermissionModal,
    setShowPermissionModal,

    // Actions
    getCurrentLocation,
    getIPLocationData: () => ipLocationQuery.refetch(), // Use React Query refetch
    refreshLocation,
    clearLocation,
    retryPermission,

    // Computed values - GPS prioritized
    coordinates: bestCoordinates, // Best available coordinates (GPS first)
    ipCoordinates,
    addressParts,
    ipLocationData,

    // Utilities
    isLocationFresh,
    hasGPS: !!position,
    hasIP: !!ipLocation,
    hasAccurateLocation: position ? position.accuracy < 100 : false,
    accuracyLevel,
    isMobile: isMobileDevice(),
    isSupported: isGeolocationSupported(),
    canRetry: permissionStatus === "denied" && permissionRequestCount < 3,
    
    // Additional GPS priority info
    isUsingGPS: bestAvailableLocation?.source === "gps",
    isUsingIP: bestAvailableLocation?.source === "ip",
  };
};
