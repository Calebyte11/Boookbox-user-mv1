import { useState, useEffect, useCallback } from 'react';
import { useLocationStore } from '@/store/locationStore';
import { locationSuggestionsService, type LocationSuggestion } from '@/services/locationSuggestionsService';

// Enhanced hook to provide contextual location suggestions from OpenStreetMap
export function useSimpleLocationSuggestions() {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locationStore = useLocationStore();

  const fetchSuggestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const context = {
        currentCity: locationStore.address?.city,
        currentState: locationStore.address?.state,
        userPosition: locationStore.position ? {
          latitude: locationStore.position.latitude,
          longitude: locationStore.position.longitude
        } : undefined
      };

      const results = await locationSuggestionsService.getLocationSuggestions(context);
      setSuggestions(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch suggestions';
      setError(errorMessage);
      console.error('Failed to fetch location suggestions:', err);
      
      // Fallback to empty array on error
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [locationStore.address?.city, locationStore.address?.state, locationStore.position]);

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
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    error,
    refresh: fetchSuggestions,
    search: searchLocations
  };
}
