/**
 * Simple location service for getting user coordinates
 * Uses Geolocation API first, then IP-based location as fallback
 */
import { getSafeLocation, isIOSDevice } from "@/utils/iosLocationFix";
const CURRENT_IP_ADDRESS =
  import.meta.env.VITE_CURRENT_IP_ADDRESS || "https://ipapi.co/json";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface IPLocationResponse {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  error?: boolean;
  reason?: string;
}

/**
 * Simple location service that gets user coordinates
 */
export class LocationService {
  private static readonly CACHE_KEY = "user_location_cache";
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get user's current location coordinates
   * Priority: Cached location > Geolocation API > IP-based location
   */
  static async getCurrentLocation(): Promise<Coordinates> {
    try {
      // First check if we have cached coordinates
      const cached = this.getCachedLocation();
      if (cached) {
        console.log("Using cached location");
        return cached;
      }

      // Try to get location from Geolocation API
      try {
        const gpsLocation = await this.getGPSLocation();
        this.cacheLocation(gpsLocation);
        console.log("Using GPS location");
        return gpsLocation;
      } catch (gpsError) {
        console.log("GPS location failed, trying IP location:", gpsError);
      }

      // Fallback to IP-based location
      const ipLocation = await this.getIPLocation();
      this.cacheLocation(ipLocation);
      console.log("Using IP-based location");
      return ipLocation;
    } catch (error) {
      console.error("All location methods failed:", error);
      // Default to Lagos, Nigeria as final fallback
      return { latitude: 6.5244, longitude: 3.3792 };
    }
  }

  /**
   * Get location using browser's Geolocation API with iOS safety
   */
  private static async getGPSLocation(): Promise<Coordinates> {
    try {
      // Use iOS-safe location service
      const result = await getSafeLocation({
        enableHighAccuracy: !isIOSDevice(), // iOS prefers false
        timeout: isIOSDevice() ? 15000 : 10000,
        maximumAge: 300000,
        fallbackToIP: false // Don't fallback here, handle it in the calling method
      });

      if (result.success && result.position) {
        return {
          latitude: result.position.coords.latitude,
          longitude: result.position.coords.longitude,
        };
      } else {
        throw new Error(result.error || "GPS location failed");
      }
    } catch (error) {
      console.error('GPS location failed:', error);
      throw error;
    }
  }

  /**
   * Get location using IP address
   */
  private static async getIPLocation(): Promise<Coordinates> {
    try {
      const response = await fetch(`${CURRENT_IP_ADDRESS}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: IPLocationResponse = await response.json();

      if (data.error) {
        throw new Error(data.reason || "IP location service error");
      }

      if (!data.latitude || !data.longitude) {
        throw new Error("Invalid coordinates from IP service");
      }

      return {
        latitude: data.latitude,
        longitude: data.longitude,
      };
    } catch (error) {
      console.error("IP location failed:", error);
      throw error;
    }
  }
  /**
   * Cache location in localStorage
   */
  private static cacheLocation(location: Coordinates): void {
    try {
      const cacheData = {
        coordinates: location,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn("Failed to cache location:", error);
    }
  }

  /**
   * Get cached location if still valid
   */
  private static getCachedLocation(): Coordinates | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { coordinates, timestamp } = JSON.parse(cached);

      // Check if cache is still valid (24 hours)
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return coordinates;
    } catch (error) {
      console.warn("Failed to get cached location:", error);
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    }
  }
  /**
   * Fallback to get current location when profile city is provided
   * Simply uses the current location service instead of manual mapping
   * @param city - The city name (not used, just for interface compatibility)
   * @returns Promise<Coordinates>
   */
  static async geocodeAddress(city: string): Promise<Coordinates> {
    console.log(
      `Getting location for city: ${city}, using current location service`
    );
    // Just use the current location service instead of manual city mapping
    return this.getCurrentLocation();
  }

  /**
   * Clear cached location
   */
  static clearLocationCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  /**
   * Check if coordinates are valid
   */
  static isValidCoordinates(coords: Coordinates): boolean {
    return (
      coords.latitude >= -90 &&
      coords.latitude <= 90 &&
      coords.longitude >= -180 &&
      coords.longitude <= 180
    );
  }
}
