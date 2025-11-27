import { useQuery } from "@tanstack/react-query";
// TanStack Query hook for cached reverse geocoding
export function useReverseGeocode(lat: number, lng: number) {
  return useQuery({
    queryKey: ["reverseGeocode", lat, lng],
    queryFn: () => reverseGeocode(lat, lng),
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!lat && !!lng,
  });
}
import { useLocationStore } from "@/store/locationStore";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface AddressParts {
  city?: string;
  state?: string;
  country?: string;
  [key: string]: string | undefined;
}

// Get current position using browser geolocation with iOS safety
export async function getCurrentPosition(): Promise<GeoPosition> {
  try {
    // Use iOS-safe location service
    const { getSafeLocation, isIOSDevice } = await import("@/utils/iosLocationFix");
    
    const result = await getSafeLocation({
      enableHighAccuracy: !isIOSDevice(), // iOS prefers false
      timeout: isIOSDevice() ? 15000 : 10000,
      maximumAge: 300000,
      fallbackToIP: true
    });

    if (result.success && result.position) {
      const geo = {
        lat: result.position.coords.latitude,
        lng: result.position.coords.longitude,
        accuracy: result.position.coords.accuracy,
      };
      
      // Save to store
      const store = useLocationStore.getState();
      store.setPosition({
        latitude: geo.lat,
        longitude: geo.lng,
        accuracy: geo.accuracy ?? 0,
        timestamp: Date.now(),
        source: result.source === 'gps' ? 'gps' : 'ip',
      });
      
      return geo;
    } else {
      throw new Error(result.error || "Location unavailable");
    }
  } catch (error) {
    console.error('getCurrentPosition failed:', error);
    throw error;
  }
}

// Simple reverse geocoding using OpenStreetMap Nominatim
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<AddressParts> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch address");
  const data = await res.json();
  const address = data.address || {};
  const parts = {
    city: address.city || address.town || address.village || "",
    state: address.state || "",
    country: address.country || "",
  };
  // Save to store
  const store = useLocationStore.getState();
  store.setAddress({
    city: parts.city,
    state: parts.state,
    country: parts.country,
    formatted: `${parts.city}, ${parts.state}, ${parts.country}`,
  });
  return parts;
}
