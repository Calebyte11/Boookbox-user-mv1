import React, { Component } from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class LocationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('LocationErrorBoundary - Error caught:', error.message);
    
    // Ignore NotFoundError from DOM manipulation (removeChild issues)
    if (error.name === 'NotFoundError' && error.message.includes('removeChild')) {
      console.warn('DOM cleanup error (removeChild) - ignoring and continuing:', error.message);
      return { hasError: false };
    }
    
    // Only catch actual location-related errors, not all JavaScript errors
    const isLocationError = error.message.includes('location') || 
                           error.message.includes('GPS') || 
                           error.message.includes('geolocation') ||
                           error.message.includes('getCurrentPosition') ||
                           error.name === 'GeolocationPositionError';
    
    if (isLocationError) {
      return { hasError: true, error };
    }
    
    // For non-location errors, don't trigger the error boundary
    console.log('Non-location error, allowing normal error handling');
    throw error; // Re-throw non-location errors
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Location Error Boundary caught an error:', error, errorInfo);
    
    // Log specific location-related errors
    if (error.message.includes('location') || error.message.includes('GPS') || error.message.includes('geolocation')) {
      console.error('Location service error detected:', error.message);
    }
    
    // Don't let the error boundary trigger for minor location issues that can be recovered
    if (error.message.includes('timeout') || 
        error.message.includes('Network request failed') ||
        error.message.includes('fetching location') ||
        error.message.includes('User denied') ||
        'code' in error && (error as { code: number }).code === 1) { // PERMISSION_DENIED
      // Reset error state to allow app to continue
      console.log('Recoverable location error, allowing app to continue');
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center p-6 max-w-md mx-auto">
            <div className="mb-4 text-6xl">📍</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Location Access Issue
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to access your location right now. The app will work with a default location for now.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  // Don't reload, just continue with the app
                }}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Continue Without Location
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LocationErrorBoundary;
