/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AlertCircle, Search, ChevronLeft } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Button from "@/components/Button";
import RestaurantCard from "@/components/RestaurantCard";
import { useNavigate } from "react-router-dom";
import {
  useAllFrozenFoodsQuery,
  useRecommendedFrozenFoodsQuery,
} from "@/hooks/useFrozenFoodsQueries";
import { useLocationStore } from "@/store/locationStore";
import { formatCurrency } from "@/utils/formatCurrency";

const ViewAllFrozenFoods = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "recent" | "active" | "inactive" | "city"
  >("all");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const locationStore = useLocationStore();

  // Fetch all frozen foods (fallback)
  const {
    data: allFrozenFoodsData,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useAllFrozenFoodsQuery();

  // Resolve coordinates: prefer manualLocation, then GPS position
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

  // Fetch recommended frozen foods when coordinates are available
  const {
    data: recommendedData,
    isLoading: isLoadingRecommended,
    isError: isRecommendedError,
  } = useRecommendedFrozenFoodsQuery(
    coords?.lat,
    coords?.lng,
    "frozen-foods",
    undefined,
    undefined
  );

  // Choose data source: prefer recommended when available, otherwise fallback to all
  const frozenFoodsData = useMemo(() => {
    if (Array.isArray(recommendedData) && recommendedData.length > 0) {
      return recommendedData as any;
    }
    return allFrozenFoodsData as any;
  }, [recommendedData, allFrozenFoodsData]);

  // Transform frozen foods data into a uniform array for UI
  const frozenFoods = useMemo(() => {
    if (!frozenFoodsData) return [];

    // Handle different response structures
    let frozenFoodsList: any[] = [];
    if (Array.isArray(frozenFoodsData)) {
      frozenFoodsList = frozenFoodsData;
    } else if (
      (frozenFoodsData as any).data &&
      Array.isArray((frozenFoodsData as any).data)
    ) {
      frozenFoodsList = (frozenFoodsData as any).data;
    } else if (
      (frozenFoodsData as any).frozenFoods &&
      Array.isArray((frozenFoodsData as any).frozenFoods)
    ) {
      frozenFoodsList = (frozenFoodsData as any).frozenFoods;
    } else {
      return [];
    }

    // Transform to display format
    return frozenFoodsList.map((frozenFood: any) => {
      const minPrice = frozenFood.minPrice ?? 1000;
      const maxPrice = frozenFood.maxPrice ?? 20000;
      const paymentCurrency = frozenFood.paymentCurrency || "NGN";
      const averageRating = frozenFood.averageRating ?? frozenFood.rating ?? 0;
      
      // Try multiple fields for ID - API may use different names
      const id = frozenFood.restaurantId || frozenFood._id || frozenFood.businessId || frozenFood.id || "";
      
      if (!id) {
        console.warn("Frozen foods store missing ID field. Data:", {
          name: frozenFood.name,
          keys: Object.keys(frozenFood),
          data: frozenFood
        });
      }
      
      return {
        id,
        title: frozenFood.name || frozenFood.restaurantName || "Frozen Foods",
        image: frozenFood.image || frozenFood.profileImage || "",
        rating: averageRating,
        paymentCurrency,
        minPrice,
        maxPrice,
        city: frozenFood.city || "",
        state: frozenFood.state || "",
        status: frozenFood.isActive ? "active" : "inactive",
        createdAt: frozenFood.createdAt,
        updatedAt: frozenFood.updatedAt,
        menuId: frozenFood.menuId || "",
        price: `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`,
      };
    });
  }, [frozenFoodsData]);

  // Extract unique cities for city filter from transformed data
  const cityList = useMemo(() => {
    const cities = frozenFoods.map((r: any) => r.city?.trim()).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [frozenFoods]);

  // Filter and sort frozen foods
  const filteredAndSortedFrozenFoods = useMemo(() => {
    if (!frozenFoods) return [];
    let filtered = frozenFoods;

    // City filter
    if (filterBy === "city") {
      let cityFiltered = frozenFoods;
      if (citySearch.trim()) {
        const cityQuery = citySearch.toLowerCase().trim();
        cityFiltered = cityFiltered.filter((r: any) =>
          r.city.toLowerCase().includes(cityQuery)
        );
      }
      if (selectedCity) {
        cityFiltered = cityFiltered.filter(
          (r: any) => r.city.toLowerCase() === selectedCity.toLowerCase()
        );
      }
      filtered = cityFiltered;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (frozenFood: any) =>
          frozenFood.title.toLowerCase().includes(query) ||
          frozenFood.price.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy === "active") {
      filtered = filtered.filter(
        (frozenFood: any) => frozenFood.status === "active"
      );
    } else if (filterBy === "inactive") {
      filtered = filtered.filter(
        (frozenFood: any) => frozenFood.status === "inactive"
      );
    }

    // Sort frozen foods - recent first
    if (filterBy === "recent" || filterBy === "all") {
      filtered = [...filtered].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.updatedAt || "").getTime();
        const dateB = new Date(b.createdAt || b.updatedAt || "").getTime();

        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB - dateA;
      });
    }

    return filtered;
  }, [frozenFoods, searchQuery, filterBy, citySearch, selectedCity]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const isInitialLoading =
    !frozenFoods.length && (isLoadingAll || isLoadingRecommended);
  if (isInitialLoading) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Frozen Foods...</p>
          </div>
        </div>
      </section>
    );
  }

  const showError = !frozenFoods.length && (errorAll || isRecommendedError);
  if (showError) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load Frozen Foods</p>
            <Button
              className="bg-[#FF7A00] text-white px-4 py-2 rounded-lg"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4">
      {/* Header */}
      <div className="flex items-center mb-4 md:block">
        <Button
          className="rounded-xl p-2 bg-[#ECE6F0] mr-4 md:mr-0 md:mb-4"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-6 w-6 text-black" />
        </Button>
        <h1 className="text-2xl font-semibold text-center flex-1 md:text-left">
          All Frozen Foods{" "}
          <span className="bg-primary/10 p-1.5 px-3 rounded-lg">
            {filteredAndSortedFrozenFoods.length}
          </span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <form className="relative" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search frozen foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[#ECE6F0] py-3 px-10 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F]" />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#49454F] hover:text-[#FF7A00]"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: "all", label: "All", count: frozenFoods.length },
          { key: "recent", label: "Recent", count: frozenFoods.length },
          {
            key: "active",
            label: "Active",
            count: frozenFoods.filter(
              (r: { status: string }) => r.status === "active"
            ).length,
          },
          {
            key: "inactive",
            label: "Inactive",
            count: frozenFoods.filter(
              (r: { status: string }) => r.status === "inactive"
            ).length,
          },
          {
            key: "city",
            label: "City",
            count: cityList.length,
          },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => {
              setFilterBy(filter.key as typeof filterBy);
              if (filter.key !== "city") {
                setSelectedCity("");
                setCitySearch("");
              }
            }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filterBy === filter.key
                ? "bg-[#FF7A00] text-white"
                : "bg-[#ECE6F0] text-black hover:bg-[#FF7A00]/10"
            }`}
          >
            {filter.label}{" "}
            <span className="bg-primary/10 py-1.5 px-3 rounded-lg ">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* City Search Input */}
      {filterBy === "city" && (
        <div className="mb-4 flex flex-col gap-2">
          <input
            type="text"
            placeholder="Search city..."
            value={citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setSelectedCity("");
            }}
            className="w-full rounded-xl bg-[#ECE6F0] py-2 px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent"
          />
          {/* City List Dropdown */}
          {citySearch.trim() && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="w-full text-left bg-white border rounded-lg shadow p-2 focus:outline-none"
                >
                  <span className="text-gray-700">Select city</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="bg-white border rounded-lg shadow p-2 max-h-40 overflow-y-auto min-w-[180px] z-50"
                  sideOffset={4}
                >
                  {cityList
                    .filter((city) =>
                      city.toLowerCase().includes(citySearch.toLowerCase())
                    )
                    .map((city) => (
                      <DropdownMenu.Item
                        key={city}
                        className={`block w-full text-left px-3 py-1 rounded cursor-pointer select-none outline-none transition-colors ${
                          selectedCity === city
                            ? "bg-[#FF7A00] text-white"
                            : "hover:bg-[#FF7A00]/10 text-black"
                        }`}
                        onSelect={() => setSelectedCity(city)}
                      >
                        {city}
                      </DropdownMenu.Item>
                    ))}
                  {cityList.filter((city) =>
                    city.toLowerCase().includes(citySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-gray-400 px-3 py-1">
                      No cities found
                    </div>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
          {/* Selected City Indicator */}
          {selectedCity && (
            <div className="text-sm text-gray-700 mt-1">
              Filtering by city:{" "}
              <span className="font-semibold">{selectedCity}</span>
              <button
                className="ml-2 text-xs text-red-500 underline"
                onClick={() => setSelectedCity("")}
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search Results Indicator */}
      {searchQuery && (
        <div className="mb-4 p-3 bg-[#E3F5FF] rounded-lg">
          <p className="text-sm text-gray-700">
            Showing {filteredAndSortedFrozenFoods.length} result(s) for "
            {searchQuery}"
          </p>
        </div>
      )}

      {/* Frozen Foods Cards Grid */}
      {filteredAndSortedFrozenFoods.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedFrozenFoods.map(
            (frozenFood: any, index: number) => (
              <RestaurantCard
                key={index}
                id={frozenFood.id || frozenFood.title}
                title={frozenFood.title}
                image={frozenFood.image}
                rating={frozenFood.rating || 0}
                price={frozenFood.price}
                status={frozenFood.status as "active" | "inactive"}
                city={frozenFood.city}
                state={frozenFood.state}
                category="frozenfoods"
              />
            )
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No frozen foods found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No frozen foods available at the moment"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ViewAllFrozenFoods;