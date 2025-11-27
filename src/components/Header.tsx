/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { ChevronDown, MapPin, Bell, Search, History } from "lucide-react";
import Brand from "@/assets/svg/Brand.svg";
import {
  useLocation as useRouterLocation,
  // useParams,
  useNavigate,
} from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import FilterDialog from "./FilterDialog";
import { forwardGeocode, reverseGeocode } from "@/services/locationService";
import SearchDialog from "./SearchDialog";
import { useUIStore } from "@/store/uiStore";
import { useSearch } from "@/hooks/useSearch";
import { useLocationStore } from "@/store/locationStore";
import { useUnreadNotificationsCountQuery } from "@/hooks/useNotificationServices";
import { useLocationSuggestions } from "@/services/locationSuggestionsService";
import BrochureCallout from "./BrochureCallout";
// import useAuthStore from "@/store/authStore";

const Header: React.FC = () => {
  const location = useRouterLocation();
  // const { restaurantId } = useParams<{ restaurantId: string }>();
  // const { user } = useAuthStore();
  const { isHeaderSearchOpen, closeHeaderSearch } = useUIStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // const [locationInput, setLocationInput] = useState("");
  // const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const locationStore = useLocationStore();
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Get contextual location suggestions
  const { 
    suggestions: locationSuggestions, 
    isLoading: isSuggestionsLoading, 
    fetchSuggestions 
  } = useLocationSuggestions();

  // Fetch location suggestions when component mounts or location changes
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions, locationStore.address]);

  // Notification operations
  const { data: unreadCountData } = useUnreadNotificationsCountQuery();
  const unreadCount = unreadCountData?.count || 0;

  // const {data:markasread} useMarkAllNotificationsReadMutation
  // console.log("unreadCount", unreadCount)

  // Local state for location loading and error
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  const [, setShowPermissionModal] = useState(false);
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  const MAX_LOCATION_RETRIES = 2;

  // iOS-safe location helper using our utility
  const getCurrentLocation = useCallback(
    async (isRetry = false) => {
      if (isRetry && locationRetryCount >= MAX_LOCATION_RETRIES) return;
      
      try {
        // Import iOS utilities dynamically
        const { getSafeLocation, isIOSDevice } = await import("@/utils/iosLocationFix");
        
        // For iOS devices, use more conservative approach
        if (isIOSDevice()) {
          console.log('iOS device detected - using safe location approach');
          
          // Check if we're in PWA mode
          const isPWA = 'standalone' in navigator && (navigator as unknown as { standalone?: boolean }).standalone === true;
          
          if (isPWA && !isRetry) {
            // For iOS PWA, defer initial request with user-friendly fallback
            console.log('iOS PWA detected - deferring location request for better UX');
            setTimeout(() => {
              // Only try if user hasn't manually set location yet
              if (!locationStore.position && !locationStore.manualLocation) {
                getCurrentLocation(true);
              }
            }, 8000); // 8 second delay for iOS PWA
            
            // Set fallback location display immediately
            if (!locationStore.position && !locationStore.manualLocation) {
              setLocationError(null);
              // Don't show "Lagos, NG" immediately, let it show gracefully
            }
            return;
          }
        }

        // Show loading indicator for manual requests or non-iOS
        if (isRetry || !isIOSDevice()) {
          setIsLocationLoading(true);
        }
        setLocationError(null);

        // Use conservative settings for iOS
        const result = await getSafeLocation({
          enableHighAccuracy: isIOSDevice() ? false : true, // iOS prefers false
          timeout: isIOSDevice() ? 20000 : 10000, // Longer timeout for iOS
          maximumAge: 300000, // 5 minutes cache
          fallbackToIP: true // Always use IP fallback
        });

        if (result.success && result.position) {
          setPermissionStatus("granted");
          const { latitude, longitude, accuracy } = result.position.coords;
          
          // Save position to store
          locationStore.setPosition({
            latitude,
            longitude,
            accuracy,
            timestamp: Date.now(),
            source: result.source === 'gps' ? 'gps' : 'ip',
          });

          // Reverse geocode with better error handling
          try {
            const address = await reverseGeocode(latitude, longitude);
            locationStore.setAddress(address);
            locationStore.setLocationSource(result.source === 'gps' ? 'gps' : 'ip');
          } catch (err: any) {
            console.error('Reverse geocoding failed:', err);
            // Don't set error for geocoding failure, just use coordinates
            console.log('Using coordinates without address');
          }
          
          setLocationRetryCount(0); // Reset retry count on success
        } else {
          // Graceful failure handling
          console.log('Location request failed gracefully:', result.error);
          
          // Don't show aggressive error states for iOS
          if (isIOSDevice()) {
            // For iOS, silently fall back without showing error
            setPermissionStatus("prompt"); // Keep it as prompt, not denied
            // Don't set error message for iOS to avoid breaking UX
          } else {
            setPermissionStatus("denied");
            setLocationError(result.error || "Location access failed");
            setShowPermissionModal(true);
          }
          setLocationRetryCount((prev) => prev + 1);
        }
      } catch (err: any) {
        console.error('Location request failed:', err);
        
        // Graceful error handling for iOS
        if (await import("@/utils/iosLocationFix").then(m => m.isIOSDevice())) {
          // For iOS, fail silently without breaking UX
          setPermissionStatus("prompt");
          console.log('iOS location failed silently, continuing without location');
        } else {
          setPermissionStatus("denied");
          setLocationError("Location service unavailable");
          setShowPermissionModal(true);
        }
        setLocationRetryCount((prev) => prev + 1);
      } finally {
        setIsLocationLoading(false);
      }
    },
    [locationStore, locationRetryCount]
  );

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    placeholder,
    handleSearchSubmit,
    handleResultClick,
  } = useSearch({});

  // Only fetch geolocation if both are missing and not denied, with graceful iOS handling
  useEffect(() => {
    // Only run on mount
    const hasLocationPersisted =
      !!locationStore.position || !!locationStore.manualLocation;
    
    if (!hasLocationPersisted && permissionStatus !== "denied") {
      // Import iOS utilities and handle gracefully
      import("@/utils/iosLocationFix").then(({ isIOSDevice }) => {
        if (isIOSDevice()) {
          console.log('iOS device detected - using graceful location handling');
          
          // Check if we're in PWA mode
          const isPWA = 'standalone' in navigator && (navigator as unknown as { standalone?: boolean }).standalone === true;
          
          if (isPWA) {
            // For iOS PWAs, be very gentle - defer request significantly
            console.log('iOS PWA detected - deferring location for optimal UX');
            setTimeout(() => {
              // Only request if user hasn't set location manually
              if (!locationStore.position && !locationStore.manualLocation) {
                getCurrentLocation().catch(err => {
                  console.log('iOS PWA location request failed gracefully:', err);
                  // Don't show errors for iOS PWA failures
                });
              }
            }, 12000); // 12 second delay for iOS PWA
          } else {
            // For iOS Safari, use moderate delay
            setTimeout(() => {
              getCurrentLocation().catch(err => {
                console.log('iOS Safari location request failed gracefully:', err);
                // Don't break the app for iOS location failures
              });
            }, 6000); // 6 second delay for iOS Safari
          }
        } else {
          // Non-iOS devices can request after shorter delay
          setTimeout(() => {
            getCurrentLocation().catch(err => {
              console.error('Location request failed:', err);
              // Handle non-iOS errors normally
            });
          }, 2000); // 2 second delay for other devices
        }
      }).catch(err => {
        console.error('Failed to load iOS utilities:', err);
        // Fallback for module loading failure
        setTimeout(() => {
          getCurrentLocation().catch(console.error);
        }, 3000);
      });
    }
    // Do not refetch if already present in store (persisted)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getLocationDisplay = useCallback(() => {
    if (isLocationLoading) return "Getting location...";
    if (locationError) return "Location unavailable";
    
    // Prioritize manual location (user selected)
    if (locationStore.manualLocation) {
      return locationStore.manualLocation.label;
    }
    
    // Use current location data with improved formatting
    if (locationStore.address) {
      const { city, state, suburb, neighbourhood, county, formatted } = locationStore.address;
      
      // Best case: City and State
      if (city && state && city !== "Unknown City") {
        return `${city}`;
      }
      
      // If city is unknown, try other location components
      if (city === "Unknown City" || !city) {
        // Try suburb first
        if (suburb && state) {
          return `${suburb}`;
        }
        // Then neighbourhood
        if (neighbourhood && state) {
          return `${neighbourhood}`;
        }
        // Then county
        if (county && state) {
          return `${county}`;
        }
        // Finally just state
        if (state) {
          return state;
        }
      }
      
      // Fallback to formatted address
      if (formatted) {
        // Clean up formatted address for better display
        const cleanFormatted = formatted
          .split(',')
          .slice(0, 2) // Take first 2 parts
          .map(part => part.trim())
          .join(', ');
        return cleanFormatted || formatted;
      }
    }
    
    // Final fallbacks based on permission status
    if (permissionStatus === "denied") {
      return "Location access denied";
    }
    
    // Default fallback
    return "Lagos, Nigeria"; // More specific than "Lagos, NG"
  }, [
    isLocationLoading,
    locationError,
    locationStore.manualLocation,
    locationStore.address,
    permissionStatus,
  ]);

  const locations = useMemo(() => {
    let locationName = "Current Location";
    let locationDescription = "";
    
    if (locationStore.manualLocation) {
      locationName = locationStore.manualLocation.label;
      locationDescription = "Manually selected";
    } else if (locationStore.address) {
      const { city, state, suburb, neighbourhood, county, formatted } = locationStore.address;
      
      // Create primary location name
      if (city && state && city !== "Unknown City") {
        locationName = `${city}, ${state}`;
      } else if (city === "Unknown City" || !city) {
        if (suburb && state) {
          locationName = `${suburb}, ${state}`;
        } else if (neighbourhood && state) {
          locationName = `${neighbourhood}, ${state}`;
        } else if (county && state) {
          locationName = `${county}, ${state}`;
        } else if (state) {
          locationName = state;
        } else if (formatted) {
          const cleanFormatted = formatted
            .split(',')
            .slice(0, 2)
            .map(part => part.trim())
            .join(', ');
          locationName = cleanFormatted || formatted;
        }
      }
      
      // Create description for current location
      if (locationStore.position) {
        locationDescription = "Current location";
      } else {
        locationDescription = "Default location";
      }
    } else {
      locationName = "Lagos, Nigeria";
      locationDescription = "Default location";
    }
    
    return [{ 
      name: locationName, 
      id: "current",
      description: locationDescription 
    }];
  }, [locationStore.manualLocation, locationStore.address, locationStore.position]);

  useEffect(() => {
    if (isFilterDialogOpen) {
      setIsSearchOpen(false);
    }
  }, [isFilterDialogOpen]);

  useEffect(() => {
    if (isHeaderSearchOpen) {
      setIsSearchOpen(true);
      if (searchInputRef.current && window.innerWidth >= 768) {
        searchInputRef.current.focus();
      }
    }
  }, [isHeaderSearchOpen]);

  // Close desktop search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(event.target as Node) &&
        window.innerWidth >= 768
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle when user selects 'current' (auto) or enters a city
  const handleLocationSelect = async (loc: { id: string; name: string }) => {
    if (loc.id === "current") {
      locationStore.clearManualLocation();
      // setLocationInput("");
      // Only fetch if not already present
      if (!locationStore.position) {
        await getCurrentLocation();
      }
    } else {
      // Handle selection of suggested location
      const selectedSuggestion = locationSuggestions.find(s => s.id === loc.id);
      if (selectedSuggestion) {
        // If we have coordinates, use them directly
        if (selectedSuggestion.coordinates) {
          const { latitude, longitude } = selectedSuggestion.coordinates;
          
          // Set position in store
          locationStore.setPosition({
            latitude,
            longitude,
            accuracy: 1000,
            timestamp: Date.now(),
            source: "ip", // Use IP as source for manual selections
          });

          // Try to reverse geocode for full address
          try {
            const address = await reverseGeocode(latitude, longitude);
            locationStore.setAddress(address);
            
            // Set manual location after address is available
            locationStore.setManualLocation({
              position: {
                latitude,
                longitude,
                accuracy: 1000,
                timestamp: Date.now(),
                source: "ip",
              },
              address: address,
              label: selectedSuggestion.displayName,
            });
          } catch (err) {
            console.warn('Reverse geocoding failed for suggestion:', err);
            // Create basic address from suggestion data
            const basicAddress = {
              city: selectedSuggestion.name,
              state: selectedSuggestion.metadata?.state || '',
              country: selectedSuggestion.metadata?.country || 'Nigeria',
              formatted: selectedSuggestion.displayName
            };
            locationStore.setAddress(basicAddress);
            
            // Set manual location with basic address
            locationStore.setManualLocation({
              position: {
                latitude,
                longitude,
                accuracy: 1000,
                timestamp: Date.now(),
                source: "ip",
              },
              address: basicAddress,
              label: selectedSuggestion.displayName,
            });
          }
          
          locationStore.setLocationSource("ip");
        } else {
          // If no coordinates, try to geocode the location name
          setIsLocationSearching(true);
          try {
            const result = await forwardGeocode(selectedSuggestion.displayName);
            if (result && result.address) {
              const label = selectedSuggestion.displayName;
              locationStore.setManualLocation({
                position: {
                  latitude: result.lat,
                  longitude: result.lng,
                  accuracy: 1000,
                  timestamp: Date.now(),
                  source: "ip",
                },
                address: result.address,
                label,
              });
              locationStore.setAddress(result.address);
              locationStore.setPosition({
                latitude: result.lat,
                longitude: result.lng,
                accuracy: 1000,
                timestamp: Date.now(),
                source: "ip",
              });
              locationStore.setLocationSource("ip");
            }
          } catch (err) {
            console.error('Failed to geocode suggested location:', err);
          } finally {
            setIsLocationSearching(false);
          }
        }
      }
    }
    // setIsEditingLocation(false);
  };

  // Handle manual city input and geocode
  const handleLocationInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    // setLocationInput(value);
    if (value.length < 2) return;
    setIsLocationSearching(true);
    const result = await forwardGeocode(value);
    setIsLocationSearching(false);
    if (result && result.address) {
      const label =
        result.address.city && result.address.state
          ? `${result.address.city}, ${result.address.state}`
          : result.address.formatted;
      locationStore.setManualLocation({
        position: {
          latitude: result.lat,
          longitude: result.lng,
          accuracy: 1000,
          timestamp: Date.now(),
          source: "ip",
        },
        address: result.address,
        label,
      });
      locationStore.setAddress(result.address);
      locationStore.setPosition({
        latitude: result.lat,
        longitude: result.lng,
        accuracy: 1000,
        timestamp: Date.now(),
        source: "ip",
      });
      locationStore.setLocationSource("ip");
    }
  };

  const handleRecentSearchClick = (item: string) => {
    setSearchQuery(item);
    if (!searchHistory.includes(item)) {
      setSearchHistory([item, ...searchHistory].slice(0, 5));
    }
  };

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (!searchHistory.includes(searchQuery)) {
        setSearchHistory([searchQuery, ...searchHistory].slice(0, 5));
      }
      handleSearchSubmit(e);
    }
  };

  if (
    !isSearchOpen &&
    !isFilterDialogOpen &&
    ["/auth", "/auth"].includes(location.pathname)
  ) {
    return null;
  }
  const dismissedDate = localStorage.getItem("brochureCalloutDismissed");

  return (
    <>
    {dismissedDate && <BrochureCallout className=" bg-primary/10 text-primary p-4"/>}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <img
              src={Brand}
              className="w-[8rem] md:w-[10rem]"
              alt="Brand Logo"
              onClick={() => navigate("/")}
            />
            <div
              className="hidden md:flex md:flex-1 md:max-w-md md:mx-8 relative"
              ref={desktopSearchRef}
            >
              <form onSubmit={onSearchSubmit} className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-[#F8F8F8]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                  onFocus={() => setIsSearchOpen(true)}
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </form>

              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 z-[10000] mt-1 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                  {searchQuery.trim() && searchQuery.length >= 2 ? (
                    <div className="py-2">
                      {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm text-gray-600">
                            Searching...
                          </span>
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((result, index) => (
                          <div
                            key={`${result.type}-${result.route}-${index}`}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                            onClick={() => {
                              handleResultClick(result);
                              setIsSearchOpen(false);
                            }}
                          >
                            {result.image && (
                              <img
                                src={result.image}
                                alt={result.title}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {result.description}
                              </p>
                              {(result.metadata?.kitchenType ||
                                result.metadata?.cuisineType) && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {result.metadata.kitchenType && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                                      {result.metadata.kitchenType}
                                    </span>
                                  )}
                                  {result.metadata.cuisineType && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                      {Array.isArray(
                                        result.metadata.cuisineType
                                      )
                                        ? result.metadata.cuisineType
                                            .slice(0, 2)
                                            .join(", ")
                                        : result.metadata.cuisineType}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-gray-400 uppercase">
                              {result.type}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No results found for "{searchQuery}"
                        </div>
                      )}
                    </div>
                  ) : (
                    <ul className="py-2">
                      {searchHistory.length > 0 ? (
                        searchHistory.map((item, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              handleRecentSearchClick(item);
                              setIsSearchOpen(false);
                            }}
                          >
                            {item}
                          </li>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-black flex items-center gap-2">
                          <History size={16} /> <p>Recent Searches</p>
                        </div>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>{" "}
            <div className="flex items-center md:gap-4 gap-2 z-10">
              {" "}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className={`flex items-center gap-1 rounded-full px-3 py-1 hover:bg-gray-100 ${
                      permissionStatus === "denied" ? "text-orange-600" : ""
                    }`}
                    aria-label="Current location"
                  >
                    <MapPin
                      className={`h-4 w-4 ${
                        isLocationLoading
                          ? "text-primary animate-pulse"
                          : permissionStatus === "denied"
                          ? "text-orange-600"
                          : locationStore.manualLocation
                          ? "text-blue-600"
                          : locationStore.position
                          ? "text-black"
                          : "text-gray-600"
                      }`}
                    />
                    <div className="flex flex-col items-start sm:inline">
                      <span className="text-sm font-medium truncate md:max-w-[120px] max-w-[100px] capitalize">
                        {getLocationDisplay()}
                      </span>
                      {/* Status indicator */}
                      {/* {isLocationLoading && (
                        <span className="text-xs text-primary hidden sm:block">
                          Locating...
                        </span>
                      )}
                      {permissionStatus === "denied" && (
                        <span className="text-xs text-orange-600 hidden sm:block">
                          Access denied
                        </span>
                      )}
                      {locationStore.manualLocation && (
                        <span className="text-xs text-blue-600 hidden sm:block">
                          Manual selection
                        </span>
                      )}
                      {locationStore.position && !locationStore.manualLocation && (
                        <span className="text-xs text-black hidden sm:block">
                          Current location
                        </span>
                      )} */}
                    </div>
                    <ChevronDown className="h-4 w-4 text-black" />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[220px] rounded-md bg-white p-1 shadow-lg z-[10000]"
                    sideOffset={5}
                    align="end"
                    aria-describedby="location"
                  >
                    {permissionStatus === "denied" && (
                      <div className="px-4 py-2 text-xs text-orange-600 border-b border-gray-100 mb-1">
                        Location access denied. You can manually enter your location below or enable location in browser settings.
                      </div>
                    )}
                    {/* Editable location input */}
                    <div className="flex items-center gap-2 px-4 py-2 relative">
                      <Search className="w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        className="w-full rounded border border-gray-200 pl-2 pr-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="Search for city, area, or landmark..."
                        // value={
                        //   isEditingLocation ? locationInput : locations[0].name
                        // }
                        onChange={handleLocationInputChange}
                        // onFocus={() => {
                        //   setIsEditingLocation(true);
                        //   setLocationInput("");
                        // }}
                        // onBlur={() => {
                        //   setTimeout(() => setIsEditingLocation(false), 200);
                        // }}
                        aria-label="Search for a city, area, or landmark"
                        aria-describedby="location-help"
                      />
                      {isLocationSearching && (
                        <div className="ml-2 flex items-center">
                          <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden help text for screen readers */}
                    <div id="location-help" className="sr-only">
                      Enter a city name, area, or landmark to search for a specific location
                    </div>
                    {/* Option to revert to current location */}
                    <DropdownMenu.Item
                      key="current"
                      aria-describedby="location"
                      className="group relative flex items-center rounded px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                      onSelect={() =>
                        handleLocationSelect({
                          id: "current",
                          name: locations[0].name,
                        })
                      }
                    >
                      {(() => {
                        const location = locations[0];
                        return (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {location.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {location.description}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </DropdownMenu.Item>
                    
                    {/* Separator */}
                    <DropdownMenu.Separator className="h-px bg-gray-200 my-2" />
                    
                    {/* Dynamic location suggestions */}
                    <div className="px-4 py-2">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {locationSuggestions.length > 0 ? 'Suggested Locations' : 'Popular Locations'}
                      </div>
                      {isSuggestionsLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                          <span className="ml-2 text-xs text-gray-600">Loading suggestions...</span>
                        </div>
                      ) : locationSuggestions.length > 0 ? (
                        locationSuggestions.map((suggestion) => (
                          <DropdownMenu.Item
                            key={suggestion.id}
                            className="group relative flex items-center rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-50"
                            onSelect={() => handleLocationSelect({
                              id: suggestion.id,
                              name: suggestion.name
                            })}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <div className="flex-1">
                                <span className="text-sm text-gray-700">
                                  {suggestion.displayName || suggestion.name}
                                </span>
                                {suggestion.metadata?.state && (
                                  <div className="text-xs text-gray-500">
                                    {suggestion.metadata.state}
                                  </div>
                                )}
                              </div>
                            </div>
                          </DropdownMenu.Item>
                        ))
                      ) : (
                        // No additional fallback here; rely on service's internal fallback
                        <div className="px-2 py-2 text-xs text-gray-500">No suggestions available</div>
                      )}
                    </div>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              {/* Notifications */}
              <div>
                <button
                  className="relative rounded-full p-2 hover:bg-gray-100 cursor-pointer"
                  aria-label="Notifications"
                  onClick={() => {
                    // Only mark all as read if there are unread notifications
                    if (unreadCount > 0) {
                      // markAllRead();
                    }
                    navigate("/notifications");
                  }}
                >
                  <div className="flex items-center justify-center cursor-pointer">
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.6 -right-[1.8px] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="md:hidden pb-4">
            <div className="relative flex items-center">
              <div className="w-full">
                <input
                  type="text"
                  placeholder={placeholder}
                  className="rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 w-full pl-10"
                  onFocus={() => setIsSearchOpen(true)}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
                />
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
              </div>
              <button
                className="ml-2 rounded-lg bg-gray-200 p-2 flex justify-center items-center"
                onClick={() => getCurrentLocation()}
                type="button"
              >
                <MapPin
                  className={`h-5 w-5 ${
                    isLocationLoading
                      ? "text-blue-500 animate-pulse"
                      : "text-black"
                  }`}
                />
              </button>
            </div>

            {isSearchOpen && (
              <div className="absolute left-0 right-0 z-10 mt-1 mx-4 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                {searchQuery.trim() && searchQuery.length >= 2 ? (
                  <div className="py-2">
                    {isSearching ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="ml-2 text-sm text-gray-600">
                          Searching...
                        </span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((result, index) => (
                        <div
                          key={`${result.type}-${result.route}-${index}`}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                          onClick={() => {
                            handleResultClick(result);
                            setIsSearchOpen(false);
                          }}
                        >
                          {result.image && (
                            <img
                              src={result.image}
                              alt={result.title}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {result.description}
                            </p>
                            {/* Display kitchen type and cuisine type if available */}
                            {(result.metadata?.kitchenType ||
                              result.metadata?.cuisineType) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.metadata.kitchenType && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                                    {result.metadata.kitchenType}
                                  </span>
                                )}
                                {result.metadata.cuisineType && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                    {Array.isArray(result.metadata.cuisineType)
                                      ? result.metadata.cuisineType
                                          .slice(0, 2)
                                          .join(", ")
                                      : result.metadata.cuisineType}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 uppercase">
                            {result.type}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="py-2">
                    {searchHistory.length > 0 ? (
                      searchHistory.map((item, index) => (
                        <li
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSearchQuery(item);
                            setIsSearchOpen(false);
                          }}
                        >
                          {item}
                        </li>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-black mt-[4rem] z-auto flex items-center gap-2">
                        <History size={16} /> <p>Recent Searches</p>
                      </div>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
      <SearchDialog
        isOpen={isSearchOpen}
        onOpenChange={(open) => {
          setIsSearchOpen(open);
          if (!open) closeHeaderSearch();
        }}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchHistory={searchHistory}
        onSearchSubmit={onSearchSubmit}
        onRecentSearchClick={handleRecentSearchClick}
        onOpenFilterDialog={() => setIsFilterDialogOpen(true)}
        placeholder={placeholder}
        searchResults={searchResults}
        isSearching={isSearching}
        onResultClick={handleResultClick}
      />
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
      />
      {/* <LocationPermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        permissionStatus={permissionStatus}
        isRetry={permissionStatus === "denied"}
      /> */}
    </>
  );
};

export default Header;
