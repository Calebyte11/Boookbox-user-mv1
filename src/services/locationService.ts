/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import type { IPLocation, Address } from "@/store/locationStore";

// Alternative IP location services to avoid CORS and rate limiting
const IP_LOCATION_SERVICES = [
  {
    name: "ipapi",
    url: "https://ipapi.co/json/",
    transform: (data: any): IPLocation => ({
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      city: data.city || "Unknown City",
      state: data.region || "Unknown State",
      country: data.country_name || "Unknown Country",
      countryCode: data.country_code || "XX",
      timezone: data.timezone || "UTC",
      isp: data.org || "Unknown ISP",
      accuracy: 10000,
      source: "ip" as const,
    }),
  },

  {
    name: "fallback",
    url: null,
    transform: (): IPLocation => ({
      latitude: 6.5244,
      longitude: 3.3792,
      city: "Lagos",
      state: "Lagos State",
      country: "Nigeria",
      countryCode: "NG",
      timezone: "Africa/Lagos",
      isp: "Unknown ISP",
      accuracy: 100,
      source: "ip" as const,
    }),
  },
];

// IP-based location service with fallbacks
const getIPLocation = async (): Promise<IPLocation> => {
  for (const service of IP_LOCATION_SERVICES) {
    try {
      if (!service.url) {
        // Fallback service
        console.log("Using fallback location (Lagos, Nigeria)");
        return service.transform({});
      }

      const response = await fetch(service.url);

      if (!response.ok) {
        console.warn(`${service.name} service failed:`, response.status);
        continue;
      }

      const data = await response.json();

      if (data.error) {
        console.warn(`${service.name} service error:`, data.error);
        continue;
      }

      console.log(`Successfully got IP location from ${service.name}`);
      return service.transform(data);
    } catch (error) {
      console.warn(`${service.name} service failed:`, error);
      continue;
    }
  }

  // This should never be reached due to fallback, but just in case
  return IP_LOCATION_SERVICES[2].transform({});
};

// Reverse geocoding using OpenStreetMap Nominatim with retry logic and error handling
const reverseGeocode = async (lat: number, lng: number): Promise<Address> => {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add delay between retries to avoid rate limiting
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "BoookBox-PWA/1.0 (contact@boookbox.com)",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Geocoding failed`);
      }

      const data = await response.json();
      const address = data.address || {};

      // Try to get the most specific city-like field available
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.suburb ||
        address.neighbourhood ||
        address.hamlet ||
        address.county ||
        address.state_district ||
        address.municipality ||
        address.locality ||
        "Unknown City";

      console.log(`Successfully reverse geocoded (${lat}, ${lng})`);
      return {
        street:
          address.road || address.house_number
            ? `${address.house_number || ""} ${address.road || ""}`.trim()
            : undefined,
        city,
        county: address.county || address.state_district || undefined,
        state: address.state || address.region || "Unknown State",
        country: address.country || "Unknown Country",
        postalCode: address.postcode,
        formatted: data.display_name || city || "Unknown Location",
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Reverse geocoding attempt ${attempt + 1} failed:`, lastError.message);
      
      // Don't retry on certain errors
      if (lastError.message.includes("AbortError") || lastError.message.includes("HTTP 429")) {
        break;
      }
      
      if (attempt === maxRetries - 1) {
        console.error("Reverse geocoding failed after retries:", lastError);
      }
    }
  }

  // Return fallback address
  console.log("Using fallback address due to geocoding service unavailable");
  return {
    city: "Lagos",
    state: "Lagos State",
    country: "Nigeria",
    formatted: "Lagos, Nigeria",
  };
};

// React Query hook for IP location
export const useIPLocationQuery = () => {
  return useQuery({
    queryKey: ["ipLocation"],
    queryFn: getIPLocation,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
    retry: false, // Don't retry as we have fallbacks built-in
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

// React Query hook for reverse geocoding
export const useReverseGeocodeQuery = (
  lat: number,
  lng: number,
  enabled = true
) => {
  return useQuery({
    queryKey: ["reverseGeocode", lat, lng],
    queryFn: () => reverseGeocode(lat, lng),
    enabled: enabled && !!lat && !!lng,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

// Forward geocoding using OpenStreetMap Nominatim with retry logic
/**
 * Get coordinates (lat, lng) and address details from a city, country, or address string.
 * @param query - e.g. "Lagos, Nigeria" or full address
 */
const forwardGeocode = async (
  query: string
): Promise<{ lat: number; lng: number; address: Address } | null> => {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add delay between retries to avoid rate limiting
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          "User-Agent": "BoookBox-PWA/1.0 (contact@boookbox.com)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Forward geocoding failed`);
      }

      const data = await response.json();
      if (!data || !data[0]) {
        console.warn(`No results found for query: "${query}"`);
        return null;
      }

      const result = data[0];
      const address = result.address || {};

      console.log(`Successfully forward geocoded: "${query}"`);
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        address: {
          street:
            address.road || address.house_number
              ? `${address.house_number || ""} ${address.road || ""}`.trim()
              : undefined,
          city:
            address.city ||
            address.town ||
            address.village ||
            address.suburb ||
            "Unknown City",
          county: address.county || address.state_district || undefined,
          state: address.state || address.region || "Unknown State",
          country: address.country || "Unknown Country",
          postalCode: address.postcode,
          formatted: result.display_name || query,
        },
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Forward geocoding attempt ${attempt + 1} failed:`, lastError.message);
      
      // Don't retry on certain errors
      if (lastError.message.includes("AbortError") || lastError.message.includes("HTTP 429")) {
        break;
      }
      
      if (attempt === maxRetries - 1) {
        console.error("Forward geocoding failed after retries:", lastError);
      }
    }
  }

  return null;
};

// Export the raw functions for direct use if needed
export { getIPLocation, reverseGeocode, forwardGeocode };
