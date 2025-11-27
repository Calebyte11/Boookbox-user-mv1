/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback } from 'react';

export interface LocationSuggestion {
  id: string;
  name: string;
  displayName: string;
  type: 'city' | 'area' | 'popular';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  metadata?: {
    state?: string;
    country?: string;
    population?: number;
  };
}

class LocationSuggestionsService {
  private cache = new Map<string, LocationSuggestion[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Mock popular locations for Nigeria (replace with actual API)
  private readonly fallbackPopularLocations: LocationSuggestion[] = [
    {
      id: 'lagos-island',
      name: 'Lagos Island',
      displayName: 'Lagos Island, Lagos',
      type: 'popular',
      coordinates: { latitude: 6.4541, longitude: 3.3947 },
      metadata: { state: 'Lagos', country: 'Nigeria' }
    },
    {
      id: 'victoria-island',
      name: 'Victoria Island',
      displayName: 'Victoria Island, Lagos',
      type: 'popular',
      coordinates: { latitude: 6.4281, longitude: 3.4219 },
      metadata: { state: 'Lagos', country: 'Nigeria' }
    },
    {
      id: 'ikeja',
      name: 'Ikeja',
      displayName: 'Ikeja, Lagos',
      type: 'popular',
      coordinates: { latitude: 6.5833, longitude: 3.3333 },
      metadata: { state: 'Lagos', country: 'Nigeria' }
    },
    {
      id: 'lekki',
      name: 'Lekki',
      displayName: 'Lekki, Lagos',
      type: 'popular',
      coordinates: { latitude: 6.4698, longitude: 3.5852 },
      metadata: { state: 'Lagos', country: 'Nigeria' }
    },
    {
      id: 'abuja',
      name: 'Abuja',
      displayName: 'Abuja, FCT',
      type: 'city',
      coordinates: { latitude: 9.0579, longitude: 7.4951 },
      metadata: { state: 'FCT', country: 'Nigeria' }
    }
  ];

  /**
   * Get location suggestions based on user's current location context
   */
  async getLocationSuggestions(context?: {
    currentCity?: string;
    currentState?: string;
    userPosition?: { latitude: number; longitude: number };
  }): Promise<LocationSuggestion[]> {
    const cacheKey = this.getCacheKey(context);
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    try {
      // Try to fetch from actual API first
      const suggestions = await this.fetchFromAPI(context);
      
      // Cache the results
      this.cache.set(cacheKey, suggestions);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return suggestions;
    } catch (error) {
      console.log('Using fallback location suggestions:', error);
      // Return contextual fallback suggestions
      return this.getContextualFallbackSuggestions(context);
    }
  }

  /**
   * Search for locations based on query
   */
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) return [];

    const cacheKey = `search:${query.toLowerCase()}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    try {
      // Try geocoding service first
      const results = await this.geocodeSearch(query);
      
      this.cache.set(cacheKey, results);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);
      
      return results;
    } catch (error) {
      console.log('Location search failed:', error);
      return this.fallbackSearch(query);
    }
  }

  /**
   * Fetch suggestions from OpenStreetMap Nominatim API
   */
  private async fetchFromAPI(context?: {
    currentCity?: string;
    currentState?: string;
    userPosition?: { latitude: number; longitude: number };
  }): Promise<LocationSuggestion[]> {
    if (!context?.currentCity && !context?.userPosition) {
      return this.getContextualFallbackSuggestions(context);
    }

    try {
      // If we have user position, use reverse geocoding to get current area
      if (context.userPosition) {
        const { reverseGeocode } = await import('@/services/locationService');
        const address = await reverseGeocode(context.userPosition.latitude, context.userPosition.longitude);
        
        // Use the resolved address to find nearby areas
        if (address.city && address.state) {
          return await this.fetchNearbyAreas(address.city, address.state, context.userPosition);
        }
      }

      // If we have city/state context, find areas within that city
      if (context.currentCity && context.currentState) {
        return await this.fetchNearbyAreas(context.currentCity, context.currentState, context.userPosition);
      }

      // Fallback to contextual suggestions
      return this.getContextualFallbackSuggestions(context);
    } catch (error) {
      console.log('Nominatim API failed, using fallback:', error);
      return this.getContextualFallbackSuggestions(context);
    }
  }

  /**
   * Fetch nearby areas/suburbs using Nominatim API
   */
  private async fetchNearbyAreas(
    city: string, 
    state: string, 
    userPosition?: { latitude: number; longitude: number }
  ): Promise<LocationSuggestion[]> {
    try {
      // First, get the city boundary to create a search area
      const { forwardGeocode } = await import('@/services/locationService');
      const cityResult = await forwardGeocode(`${city}, ${state}`);
      
      if (!cityResult) {
        throw new Error('City not found');
      }

      // Calculate search bounds around the city (roughly 0.1 degree radius)
      const radius = 0.1;
      const minLat = cityResult.lat - radius;
      const maxLat = cityResult.lat + radius;
      const minLon = cityResult.lng - radius;
      const maxLon = cityResult.lng + radius;

      // Search for suburbs/neighbourhoods in the area
      const searchQueries = [
        `suburb ${city}`,
        `neighbourhood ${city}`,
        `area ${city}`,
        city // Also search for the city itself to get districts
      ];

      const allResults: LocationSuggestion[] = [];
      const seenIds = new Set<string>();

      for (const query of searchQueries) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&viewbox=${minLon},${maxLat},${maxLon},${minLat}&bounded=1&q=${encodeURIComponent(query)}`;
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': 'BoookBox-PWA/1.0',
            },
          });

          if (!response.ok) continue;

          const data = await response.json();
          
          for (const item of data) {
            const address = item.address || {};
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            
            // Extract area name (suburb, neighbourhood, or district)
            const areaName = 
              address.suburb || 
              address.neighbourhood || 
              address.quarter ||
              address.district ||
              address.city_district ||
              address.village ||
              address.hamlet;

            if (!areaName || areaName.toLowerCase() === city.toLowerCase()) continue;

            const id = `nominatim-${item.osm_type}-${item.osm_id}`;
            if (seenIds.has(id)) continue;
            seenIds.add(id);

            const displayName = `${areaName}, ${address.city || city}`;
            
            allResults.push({
              id,
              name: areaName,
              displayName,
              type: 'area' as const,
              coordinates: { latitude: lat, longitude: lng },
              metadata: {
                state: address.state || state,
                country: address.country || 'Nigeria'
              }
            });
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
          console.warn('Search query failed:', query, err);
          continue;
        }
      }

      // Sort by distance if user position is available
      if (userPosition && allResults.length > 0) {
        allResults.sort((a, b) => {
          if (!a.coordinates || !b.coordinates) return 0;
          
          const distA = Math.sqrt(
            Math.pow(a.coordinates.latitude - userPosition.latitude, 2) +
            Math.pow(a.coordinates.longitude - userPosition.longitude, 2)
          );
          const distB = Math.sqrt(
            Math.pow(b.coordinates.latitude - userPosition.latitude, 2) +
            Math.pow(b.coordinates.longitude - userPosition.longitude, 2)
          );
          
          return distA - distB;
        });
      }

      // Return top 8 results
      return allResults.slice(0, 8);
    } catch (error) {
      console.warn('fetchNearbyAreas failed:', error);
      throw error;
    }
  }

  /**
   * Use geocoding service for location search
   */
  private async geocodeSearch(query: string): Promise<LocationSuggestion[]> {
    try {
      // Import forwardGeocode dynamically to avoid circular dependencies
      const { forwardGeocode } = await import('@/services/locationService');
      
      const result = await forwardGeocode(query);
      
      // Handle single result object (not array)
      if (result && result.address) {
        const { address } = result;
        const displayName = [
          address.suburb || address.neighbourhood || address.city,
          address.state
        ].filter(Boolean).join(', ');

        return [{
          id: `geocode-${Date.now()}`,
          name: address.city || address.suburb || query,
          displayName: displayName || query,
          type: 'area' as const,
          coordinates: {
            latitude: result.lat,
            longitude: result.lng
          },
          metadata: {
            state: address.state,
            country: address.country,
          }
        }];
      }
      
      return [];
    } catch (error) {
      console.log('Geocoding search failed:', error);
      return [];
    }
  }

  /**
   * Get contextual suggestions based on user's current location
   */
  private getContextualFallbackSuggestions(context?: {
    currentCity?: string;
    currentState?: string;
    userPosition?: { latitude: number; longitude: number };
  }): LocationSuggestion[] {
    if (!context) return this.fallbackPopularLocations;

    const { currentState, currentCity } = context;
    
    // If user is in Lagos, show Lagos-specific areas
    if (currentState?.toLowerCase().includes('lagos') || currentCity?.toLowerCase().includes('lagos')) {
      return this.fallbackPopularLocations.filter(loc => 
        loc.metadata?.state === 'Lagos'
      );
    }
    
    // If user is in Abuja, show FCT areas
    if (currentState?.toLowerCase().includes('fct') || currentCity?.toLowerCase().includes('abuja')) {
      return [
        {
          id: 'wuse',
          name: 'Wuse',
          displayName: 'Wuse, Abuja',
          type: 'area',
          metadata: { state: 'FCT', country: 'Nigeria' }
        },
        {
          id: 'garki',
          name: 'Garki',
          displayName: 'Garki, Abuja',
          type: 'area',
          metadata: { state: 'FCT', country: 'Nigeria' }
        },
        {
          id: 'maitama',
          name: 'Maitama',
          displayName: 'Maitama, Abuja',
          type: 'area',
          metadata: { state: 'FCT', country: 'Nigeria' }
        }
      ];
    }
    
    // Default: return all popular locations
    return this.fallbackPopularLocations;
  }

  /**
   * Fallback search within cached suggestions
   */
  private fallbackSearch(query: string): LocationSuggestion[] {
    const lowerQuery = query.toLowerCase();
    return this.fallbackPopularLocations.filter(location =>
      location.name.toLowerCase().includes(lowerQuery) ||
      location.displayName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Generate cache key based on context
   */
  private getCacheKey(context?: any): string {
    if (!context) return 'default';
    return `${context.currentCity || ''}-${context.currentState || ''}-${context.userPosition?.latitude || ''}-${context.userPosition?.longitude || ''}`;
  }

  /**
   * Check if cache is still valid
   */
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const locationSuggestionsService = new LocationSuggestionsService();

/**
 * React hook for location suggestions
 */
export function useLocationSuggestions() {
  const [suggestions, setSuggestions] = React.useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSuggestions = useCallback(async (context?: {
    currentCity?: string;
    currentState?: string;
    userPosition?: { latitude: number; longitude: number };
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await locationSuggestionsService.getLocationSuggestions(context);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch suggestions');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchLocations = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const results = await locationSuggestionsService.searchLocations(query);
      setSuggestions(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    fetchSuggestions,
    searchLocations
  };
}
