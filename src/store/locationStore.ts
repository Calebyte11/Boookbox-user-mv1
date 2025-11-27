import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  source?: "gps" | "ip";
}

export interface Address {
  suburb?: string;
  neighbourhood?: string;
  street?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  formatted: string;
  county?: string;
  state_district?: string;
}

export interface IPLocation {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  timezone: string;
  isp: string;
  accuracy: number;
  source: "ip";
}

export interface LocationError {
  code: number;
  message: string;
  type: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNKNOWN";
}

interface LocationState {
  // Core location data
  position: GeolocationPosition | null;
  ipLocation: IPLocation | null;
  address: Address | null;
  locationSource: "gps" | "ip" | null;
  manualLocation: {
    position: GeolocationPosition;
    address: Address;
    label: string;
  } | null;

  // Loading states
  isLoading: boolean;
  isLoadingGPS: boolean;
  isLoadingIP: boolean;

  // Permission and error states
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
  error: LocationError | null;
  showPermissionModal: boolean;
  permissionRequestCount: number;

  // Computed getters
  hasLocation: boolean;
  hasGPS: boolean;
  hasIP: boolean;
  displayLocation: string;
  isLocationFresh: boolean;
  accuracyLevel: "high" | "medium" | "low" | "none";

  // Coordinates helpers
  coordinates: {
    lat: number;
    lng: number;
    accuracy: number;
    source: "gps" | "ip";
  } | null;

  ipCoordinates: {
    lat: number;
    lng: number;
    accuracy: number;
    source: "ip";
  } | null;

  // Address parts for easy access
  addressParts: {
    county?: string;
    city: string;
    state: string;
    country: string;
    formatted: string;
    street?: string;
    postalCode?: string;
  } | null;

  // IP location data for easy access
  ipLocationData: {
    city: string;
    state: string;
    country: string;
    countryCode: string;
    timezone: string;
    isp: string;
  } | null;
}

interface LocationActions {
  setManualLocation: (data: {
    position: GeolocationPosition;
    address: Address;
    label: string;
  }) => void;
  clearManualLocation: () => void;
  // Actions
  setPosition: (position: GeolocationPosition | null) => void;
  setIpLocation: (ipLocation: IPLocation | null) => void;
  setAddress: (address: Address | null) => void;
  setLocationSource: (source: "gps" | "ip" | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsLoadingGPS: (loading: boolean) => void;
  setIsLoadingIP: (loading: boolean) => void;
  setPermissionStatus: (
    status: "granted" | "denied" | "prompt" | "unknown"
  ) => void;
  setError: (error: LocationError | null) => void;
  setShowPermissionModal: (show: boolean) => void;
  incrementPermissionRequestCount: () => void;
  updateFromBestSource: (
    gpsLocation?: GeolocationPosition,
    ipLocation?: IPLocation
  ) => void;
  clearLocation: () => void;
  resetPermissionCount: () => void;

  // Utility methods
  getBestLocation: (
    gpsLocation?: GeolocationPosition,
    ipLocation?: IPLocation
  ) => {
    position: GeolocationPosition;
    source: "gps" | "ip";
  } | null;
}

type LocationStore = LocationState & LocationActions;

// Helper function to determine the best location
const getBestLocation = (
  gpsLocation: GeolocationPosition | null,
  ipLocation: IPLocation | null
): { position: GeolocationPosition; source: "gps" | "ip" } | null => {
  if (!gpsLocation && !ipLocation) return null;

  if (gpsLocation && !ipLocation) {
    return { position: gpsLocation, source: "gps" };
  }

  if (!gpsLocation && ipLocation) {
    return {
      position: {
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
        accuracy: ipLocation.accuracy,
        timestamp: Date.now(),
        source: "ip",
      },
      source: "ip",
    };
  }

  // Both available - compare accuracy (lower is better)
  if (gpsLocation && ipLocation) {
    if (gpsLocation.accuracy <= ipLocation.accuracy) {
      return { position: gpsLocation, source: "gps" };
    } else {
      return {
        position: {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          accuracy: ipLocation.accuracy,
          timestamp: Date.now(),
          source: "ip",
        },
        source: "ip",
      };
    }
  }

  return null;
};

export const useLocationStore = create<LocationStore>()(
  persist(
    (set, get) => ({
      // Core location data
      position: null,
      ipLocation: null,
      address: null,
      locationSource: null,
      manualLocation: null,

      // Loading states
      isLoading: false,
      isLoadingGPS: false,
      isLoadingIP: false,

      // Permission and error states
      permissionStatus: "unknown" as const,
      error: null,
      showPermissionModal: false,
      permissionRequestCount: 0,

      // Computed getters - these will be computed on demand
      get hasLocation() {
        const state = get();
        if (state.manualLocation) return true;
        return !!(state.position && state.address);
      },
      get hasGPS() {
        const state = get();
        return !!(state.position && state.position.source === "gps");
      },
      get hasIP() {
        const state = get();
        return !!state.ipLocation;
      },
      get displayLocation() {
        const state = get();
        if (state.manualLocation) return state.manualLocation.label;
        if (state.address) {
          if (state.address.city)
            return state.address.city ?? "Location not available";
          if (state.address.street)
            return state.address.street ?? "Location not available";
          if (state.address.county || state.address.state_district)
            return (
              state.address.county ??
              state.address.state_district ??
              "Location not available"
            );
          return state.address.formatted ?? "Location not available";
        }
        return "Location not available";
      },
      setManualLocation: (data) => set({ manualLocation: data }),
      clearManualLocation: () => set({ manualLocation: null }),
      get isLocationFresh() {
        const state = get();
        return state.position
          ? Date.now() - state.position.timestamp < 300000 // 5 minutes
          : false;
      },
      get accuracyLevel() {
        const state = get();
        if (!state.position) return "none" as const;
        if (state.position.accuracy < 100) return "high" as const;
        if (state.position.accuracy < 1000) return "medium" as const;
        return "low" as const;
      },
      get coordinates() {
        const state = get();
        return state.position
          ? {
              lat: state.position.latitude,
              lng: state.position.longitude,
              accuracy: state.position.accuracy,
              source: state.position.source || ("gps" as const),
            }
          : null;
      },
      get ipCoordinates() {
        const state = get();
        return state.ipLocation
          ? {
              lat: state.ipLocation.latitude,
              lng: state.ipLocation.longitude,
              accuracy: state.ipLocation.accuracy,
              source: state.ipLocation.source,
            }
          : null;
      },
      get addressParts() {
        const state = get();
        return state.address
          ? {
              city: state.address.county || state.address.city,
              state: state.address.state,
              country: state.address.country,
              formatted: state.address.formatted,
              street: state.address.street,
              postalCode: state.address.postalCode,
            }
          : null;
      },
      get ipLocationData() {
        const state = get();
        return state.ipLocation
          ? {
              city: state.ipLocation.city,
              state: state.ipLocation.state,
              country: state.ipLocation.country,
              countryCode: state.ipLocation.countryCode,
              timezone: state.ipLocation.timezone,
              isp: state.ipLocation.isp,
            }
          : null;
      },

      // Actions - simplified to avoid infinite loops
      setPosition: (position) => set({ position }),
      setIpLocation: (ipLocation) => set({ ipLocation }),
      setAddress: (address) => set({ address }),
      setLocationSource: (locationSource) => set({ locationSource }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsLoadingGPS: (isLoadingGPS) => set({ isLoadingGPS }),
      setIsLoadingIP: (isLoadingIP) => set({ isLoadingIP }),
      setPermissionStatus: (permissionStatus) => set({ permissionStatus }),
      setError: (error) => set({ error }),
      setShowPermissionModal: (showPermissionModal) =>
        set({ showPermissionModal }),
      incrementPermissionRequestCount: () =>
        set((state) => ({
          permissionRequestCount: state.permissionRequestCount + 1,
        })),
      resetPermissionCount: () => set({ permissionRequestCount: 0 }),
      updateFromBestSource: (gpsLocation, ipLocation) => {
        const state = get();
        const currentGPS = gpsLocation || state.position;
        const currentIP = ipLocation || state.ipLocation;

        const bestLocation = getBestLocation(currentGPS, currentIP);

        if (bestLocation) {
          // Only update if the best location is actually different
          const isSamePosition =
            state.position &&
            Math.abs(state.position.latitude - bestLocation.position.latitude) <
              0.0001 &&
            Math.abs(
              state.position.longitude - bestLocation.position.longitude
            ) < 0.0001 &&
            state.locationSource === bestLocation.source;

          if (!isSamePosition) {
            set({
              position: bestLocation.position,
              locationSource: bestLocation.source,
            });
          }
        }
      },

      getBestLocation: (gpsLocation, ipLocation) => {
        const state = get();
        const currentGPS = gpsLocation || state.position;
        const currentIP = ipLocation || state.ipLocation;
        return getBestLocation(currentGPS, currentIP);
      },

      clearLocation: () =>
        set({
          position: null,
          ipLocation: null,
          address: null,
          locationSource: null,
          error: null,
          showPermissionModal: false,
          manualLocation: null,
        }),
    }),
    {
      name: "location-store",
      partialize: (state: LocationStore) => ({
        // Only persist the core data, not loading states or modals
        position: state.position,
        ipLocation: state.ipLocation,
        address: state.address,
        locationSource: state.locationSource,
        permissionStatus: state.permissionStatus,
        permissionRequestCount: state.permissionRequestCount,
        manualLocation: state.manualLocation,
      }),
    }
  )
);

export default useLocationStore;
