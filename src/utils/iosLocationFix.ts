/**
 * iOS Location Services Fix
 * Handles iOS-specific location service blocking and errors
 */

export interface SafeLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  fallbackToIP?: boolean;
}

export interface SafeLocationResult {
  success: boolean;
  position?: GeolocationPosition;
  error?: string;
  source: 'gps' | 'ip' | 'fallback';
}

// Detect iOS
export const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
};

// iOS-safe geolocation wrapper
export const getSafeLocation = async (options: SafeLocationOptions = {}): Promise<SafeLocationResult> => {
  const {
    enableHighAccuracy = false, // iOS prefers false for better success rate
    timeout = 10000,
    maximumAge = 600000, // 10 minutes cache for iOS
    fallbackToIP = true
  } = options;

  // Check if geolocation is available
  if (!navigator.geolocation) {
    if (fallbackToIP) {
      return await getFallbackLocation();
    }
    return {
      success: false,
      error: 'Geolocation not supported',
      source: 'gps'
    };
  }

  // iOS-specific settings
  const geoOptions: PositionOptions = isIOSDevice() ? {
    enableHighAccuracy: false, // iOS often blocks high accuracy
    timeout: 15000, // Longer timeout for iOS
    maximumAge: maximumAge
  } : {
    enableHighAccuracy,
    timeout,
    maximumAge
  };

  try {
    // First check permissions if available
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          if (fallbackToIP) {
            return await getFallbackLocation();
          }
          return {
            success: false,
            error: 'Location permission denied',
            source: 'gps'
          };
        }
      } catch (permError) {
        console.warn('Permission query failed:', permError);
      }
    }

    // Get location with proper error handling
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        geoOptions
      );
    });

    return {
      success: true,
      position,
      source: 'gps'
    };

  } catch (error: unknown) {
    console.error('GPS location failed:', error);
    
    // iOS-specific error handling
    if (fallbackToIP) {
      console.log('Falling back to IP location');
      return await getFallbackLocation();
    }

    return {
      success: false,
      error: getLocationErrorMessage(error as GeolocationPositionError),
      source: 'gps'
    };
  }
};

// Fallback to IP-based location
const getFallbackLocation = async (): Promise<SafeLocationResult> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) throw new Error('IP location service failed');
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'IP location failed');
    }

    // Create a mock GeolocationPosition for consistency
    const mockPosition: GeolocationPosition = {
      coords: {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: 10000, // IP location is less accurate
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({})
      },
      timestamp: Date.now(),
      toJSON: () => ({})
    };

    return {
      success: true,
      position: mockPosition,
      source: 'ip'
    };

  } catch {
    console.error('IP location failed');
    
    // Ultimate fallback to Lagos, Nigeria
    const fallbackPosition: GeolocationPosition = {
      coords: {
        latitude: 6.5244,
        longitude: 3.3792,
        accuracy: 50000,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({})
      },
      timestamp: Date.now(),
      toJSON: () => ({})
    };

    return {
      success: true,
      position: fallbackPosition,
      source: 'fallback'
    };
  }
};

// User-friendly error messages
const getLocationErrorMessage = (error: GeolocationPositionError): string => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access denied. Please enable location services.';
    case error.POSITION_UNAVAILABLE:
      return 'Location unavailable. Using approximate location.';
    case error.TIMEOUT:
      return 'Location request timed out. Using approximate location.';
    default:
      return 'Location service unavailable. Using approximate location.';
  }
};

// Preload location to prevent delays
export const preloadLocation = async (): Promise<void> => {
  try {
    // Just trigger the IP location service early
    fetch('https://ipapi.co/json/').catch(() => {
      // Ignore errors, this is just preloading
    });
  } catch {
    // Ignore errors, this is just preloading
  }
};
