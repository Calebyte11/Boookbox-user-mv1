/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AlertCircle, Search, ChevronLeft } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Button from "@/components/Button";
import NightlifeCard from "@/components/NightlifeCard";
import { useNavigate } from "react-router-dom";
import { useGetAllNightlifeVenues, useGetRecommendedNightlifeVenues } from "@/hooks/useNightlifeQueries";
import { useLocationStore } from "@/store/locationStore";
import { formatCurrency } from "@/utils/formatCurrency";

const ViewAllNightlife = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "recent" | "active" | "inactive" | "city"
  >("all");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  const locationStore = useLocationStore();

  const {
    data: allVenuesData,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useGetAllNightlifeVenues();

  const coords = useMemo(() => {
    const manual = locationStore.manualLocation?.position;
    const gps = locationStore.position;
    if (manual?.latitude && manual?.longitude) {
      return { lat: manual.latitude, lng: manual.longitude } as const;
    }
    if (gps?.latitude && gps?.longitude) {
      return { lat: gps.latitude, lng: gps.longitude } as const;
    }
    return null;
  }, [locationStore.manualLocation, locationStore.position]);

  const {
    data: recommendedData,
    isLoading: isLoadingRecommended,
    isError: isRecommendedError,
  } = useGetRecommendedNightlifeVenues(
    coords?.lat || 0,
    coords?.lng || 0,
    "nightlife"
  );

  // Use recommended data if available, otherwise fall back to all data
  const venues = recommendedData && recommendedData.length > 0 ? recommendedData : allVenuesData || [];

  // Filter venues
  const filteredVenues = useMemo(() => {
    let filtered = venues || [];

    if (searchQuery) {
      filtered = filtered.filter(
        (venue) =>
          venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          venue.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCity) {
      filtered = filtered.filter(
        (venue) => venue.city?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    if (filterBy === "recent") {
      filtered = filtered.sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
      );
    } else if (filterBy === "active") {
      filtered = filtered.filter((venue) => venue.isActive === true);
    } else if (filterBy === "inactive") {
      filtered = filtered.filter((venue) => venue.isActive === false);
    }

    // Apply price range filter if price data is available
    filtered = filtered.filter((venue) => {
      if (venue.priceRange) {
        const price = parseInt(venue.priceRange.toString());
        return price >= priceRange[0] && price <= priceRange[1];
      }
      return true;
    });

    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, searchQuery, selectedCity, filterBy, priceRange]);

  // Get unique cities for dropdown
  const cities = useMemo(() => {
    const uniqueCities = new Set<string>();
    venues?.forEach((venue) => {
      if (venue.city) {
        uniqueCities.add(venue.city);
      }
    });
    return Array.from(uniqueCities).sort();
  }, [venues]);

  const isLoading = isLoadingAll || isLoadingRecommended;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-slate-700" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Night Life Venues</h1>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Filter by Status */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="outline"
                className="w-full"
                size="md"
              >
                Filter: {filterBy === "all" ? "All" : filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[200px] z-50"
              align="start"
            >
              {["all", "recent", "active", "inactive", "city"].map((option) => (
                <DropdownMenu.Item
                  key={option}
                  onClick={() => setFilterBy(option as typeof filterBy)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer rounded text-sm capitalize"
                >
                  {option === "all" ? "All Venues" : option.charAt(0).toUpperCase() + option.slice(1)}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {/* Filter by City */}
          {filterBy === "city" && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  size="md"
                >
                  City: {selectedCity || "Select"}
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                className="bg-white rounded-lg shadow-lg border border-slate-200 p-2 min-w-[200px] z-50 max-h-[300px] overflow-y-auto"
                align="start"
              >
                {cities.map((city) => (
                  <DropdownMenu.Item
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer rounded text-sm"
                  >
                    {city}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}

          {/* Price Range Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">
              Price Range: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
            </label>
            <input
              type="range"
              min="0"
              max="200000"
              step="1000"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredVenues.length}</span> night life{" "}
            {filteredVenues.length === 1 ? "venue" : "venues"}
          </p>
        </div>

        {/* Error State */}
        {errorAll && !isLoadingAll && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error loading venues</h3>
              <p className="text-red-700 text-sm">Failed to load night life venues. Please try again.</p>
            </div>
          </div>
        )}

        {/* Recommended Error (non-blocking) */}
        {isRecommendedError && !isLoadingRecommended && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-900">Showing all venues</h3>
              <p className="text-yellow-700 text-sm">Unable to load location-based recommendations.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg h-80 animate-pulse"
              />
            ))}
          </div>
        ) : filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <NightlifeCard
                key={venue._id}
                venue={venue}
                onClick={() => navigate(`/nightlife/${venue._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No venues found</h3>
            <p className="text-slate-600 mb-4">
              Try adjusting your search filters or explore other categories.
            </p>
            <Button onClick={() => navigate(-1)} variant="primary" size="md">
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAllNightlife;
