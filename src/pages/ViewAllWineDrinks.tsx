/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AlertCircle, Search, ChevronLeft } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Button from "@/components/Button";
import RestaurantCard from "@/components/RestaurantCard";
import { useNavigate } from "react-router-dom";
import {
  useAllWineDrinksQuery,
  useRecommendedWineDrinksQuery,
} from "@/hooks/useWineDrinksQueries";
import { useLocationStore } from "@/store/locationStore";
import { formatCurrency } from "@/utils/formatCurrency";

const ViewAllWineDrinks = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "recent" | "active" | "inactive" | "city"
  >("all");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const locationStore = useLocationStore();

  // Fetch all wine & drinks (fallback)
  const {
    data: allWineDrinksData,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useAllWineDrinksQuery();

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

  // Fetch recommended wine & drinks when coordinates are available
  const {
    data: recommendedData,
    isLoading: isLoadingRecommended,
    isError: isRecommendedError,
  } = useRecommendedWineDrinksQuery(
    coords?.lat,
    coords?.lng,
    "wine-drinks",
    undefined,
    undefined
  );

  // Choose data source: prefer recommended when available, otherwise fallback to all
  const wineDrinksData = useMemo(() => {
    if (Array.isArray(recommendedData) && recommendedData.length > 0) {
      return recommendedData as any;
    }
    return allWineDrinksData as any;
  }, [recommendedData, allWineDrinksData]);

  // Transform wine & drinks data into a uniform array for UI
  const wineDrinks = useMemo(() => {
    if (!wineDrinksData) return [];

    // Handle different response structures
    let wineDrinksList: any[] = [];
    if (Array.isArray(wineDrinksData)) {
      wineDrinksList = wineDrinksData;
    } else if (
      (wineDrinksData as any).data &&
      Array.isArray((wineDrinksData as any).data)
    ) {
      wineDrinksList = (wineDrinksData as any).data;
    } else if (
      (wineDrinksData as any).wineDrinks &&
      Array.isArray((wineDrinksData as any).wineDrinks)
    ) {
      wineDrinksList = (wineDrinksData as any).wineDrinks;
    } else {
      return [];
    }

    // Transform to display format
    return wineDrinksList.map((wineDrink: any) => {
      const minPrice = wineDrink.minPrice ?? 1000;
      const maxPrice = wineDrink.maxPrice ?? 20000;
      const paymentCurrency = wineDrink.paymentCurrency || "NGN";
      const averageRating = wineDrink.averageRating ?? wineDrink.rating ?? 0;
      
      // Try multiple fields for ID - API may use different names
      const id = wineDrink.restaurantId || wineDrink._id || wineDrink.businessId || wineDrink.id || "";
      
      if (!id) {
        console.warn("Wine & Drinks store missing ID field. Data:", {
          name: wineDrink.name,
          keys: Object.keys(wineDrink),
          data: wineDrink
        });
      }
      
      return {
        id,
        title: wineDrink.name || wineDrink.restaurantName || "Wine & Drinks",
        image: wineDrink.image || wineDrink.profileImage || "",
        rating: averageRating,
        paymentCurrency,
        minPrice,
        maxPrice,
        city: wineDrink.city || "",
        state: wineDrink.state || "",
        status: wineDrink.isActive ? "active" : "inactive",
        createdAt: wineDrink.createdAt,
        updatedAt: wineDrink.updatedAt,
        menuId: wineDrink.menuId || "",
        price: `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`,
      };
    });
  }, [wineDrinksData]);

  // Extract unique cities for city filter from transformed data
  const cityList = useMemo(() => {
    const cities = wineDrinks.map((r: any) => r.city?.trim()).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [wineDrinks]);

  // Filter and sort wine & drinks
  const filteredAndSortedWineDrinks = useMemo(() => {
    if (!wineDrinks) return [];
    let filtered = wineDrinks;

    // City filter
    if (filterBy === "city") {
      let cityFiltered = wineDrinks;
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
        (wineDrink: any) =>
          wineDrink.title.toLowerCase().includes(query) ||
          wineDrink.price.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy === "active") {
      filtered = filtered.filter(
        (wineDrink: any) => wineDrink.status === "active"
      );
    } else if (filterBy === "inactive") {
      filtered = filtered.filter(
        (wineDrink: any) => wineDrink.status === "inactive"
      );
    }

    // Sort wine & drinks - recent first
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
  }, [wineDrinks, searchQuery, filterBy, citySearch, selectedCity]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const isInitialLoading =
    !wineDrinks.length && (isLoadingAll || isLoadingRecommended);
  if (isInitialLoading) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Wine & Drinks...</p>
          </div>
        </div>
      </section>
    );
  }

  const showError = !wineDrinks.length && (errorAll || isRecommendedError);
  if (showError) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load Wine & Drinks</p>
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
          All Wine & Drinks{" "}
          <span className="bg-primary/10 p-1.5 px-3 rounded-lg">
            {filteredAndSortedWineDrinks.length}
          </span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <form className="relative" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search wine & drinks..."
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
          { key: "all", label: "All", count: wineDrinks.length },
          { key: "recent", label: "Recent", count: wineDrinks.length },
          {
            key: "active",
            label: "Active",
            count: wineDrinks.filter(
              (r: { status: string }) => r.status === "active"
            ).length,
          },
          {
            key: "inactive",
            label: "Inactive",
            count: wineDrinks.filter(
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
            Showing {filteredAndSortedWineDrinks.length} result(s) for "
            {searchQuery}"
          </p>
        </div>
      )}

      {/* Wine & Drinks Cards Grid */}
      {filteredAndSortedWineDrinks.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedWineDrinks.map((wineDrink: any, index: number) => (
            <RestaurantCard
              key={index}
              id={wineDrink.id || wineDrink.title}
              title={wineDrink.title}
              image={wineDrink.image}
              rating={wineDrink.rating || 0}
              price={wineDrink.price}
              status={wineDrink.status as "active" | "inactive"}
              city={wineDrink.city}
              state={wineDrink.state}
              category="winedrinks"
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No wine & drinks found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No wine & drinks available at the moment"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ViewAllWineDrinks;