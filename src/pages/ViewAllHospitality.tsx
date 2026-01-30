/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AlertCircle, Search, ChevronLeft } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Button from "@/components/Button";
import RestaurantCard from "@/components/RestaurantCard";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/features/auth/hooks";

import { useAllHospitalityQuery, useRecommendedHospitalityQuery } from "@/hooks/useHospitalityQueries";

import { useLocationStore } from "@/store/locationStore";
import { formatCurrency } from "@/utils/formatCurrency";

const ViewAllHospitality = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "recent" | "active" | "inactive" | "city"
  >("all");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  // const [recommedaton] = useState(true);
  const locationStore = useLocationStore();

  const {
    data: allData,
    isLoading: isLoadingAll,
    error: errorAll,
  } = useAllHospitalityQuery();

  // resolve coordinates: prefer manualLocation, then GPS position
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
  
  // Fetch recommended gift stores when coordinates are available
  const {
    data: recommendedData,
    isLoading: isLoadingRecommended,
    isError: isRecommendedError,
  } = useRecommendedHospitalityQuery(
    coords?.lat,
    coords?.lng,
    "hospitality",
    undefined,
    undefined
    // { enabled: !!coords }
  );

  // Choose data source: prefer recommended when available, otherwise fallback to all
  const data = useMemo(() => {
    if (Array.isArray(recommendedData) && recommendedData.length > 0) {
      return recommendedData as any;
    }
    return allData as any;
  }, [recommendedData, allData]);
  
  // Transform hospitality data to proper format for display
  // Extract unique cities for city filter
  // Transform hospitality data into a uniform array for UI

  
  const items = useMemo(() => {
    if (!data) return [];

    let itemList: any[] = [];
    if (Array.isArray(data)) {
      itemList = data;
    } else if ((data as any).data && Array.isArray((data as any).data)) {
      itemList = (data as any).data;
    } else {
      return [];
    }

    return itemList.map((item: any) => {
      const minPrice = item.minPrice ?? 500;
      const maxPrice = item.maxPrice ?? 50000;
      const paymentCurrency = item.paymentCurrency || "NGN";
      const averageRating = item.averageRating ?? item.rating ?? 0;
      const id = item.giftStoreId || item._id || item.businessId || item.id || "";

      return {
        id,
        title: item.name || "Hospitality",
        image: item.image || item.profileImage || "",
        rating: averageRating,
        paymentCurrency,
        minPrice,
        maxPrice,
        city: item.city || "",
        state: item.state || "",
        status: item.isActive ? "active" : "inactive",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        price: `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(
          maxPrice,
          paymentCurrency
        )}`,
      };
    });
  }, [data]);

  const cityList = useMemo(() => {
    const cities = items.map((r: any) => r.city?.trim()).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [items]);

  // Filter and sort hospitality based on user selections
 const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];
    let filtered = items;

    if (filterBy === "city") {
      let cityFiltered = items;
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item: any) =>
          item.title.toLowerCase().includes(query) ||
          item.price.toLowerCase().includes(query)
      );
    }

    if (filterBy === "active") {
      filtered = filtered.filter((item: any) => item.status === "active");
    } else if (filterBy === "inactive") {
      filtered = filtered.filter((item: any) => item.status === "inactive");
    }

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
  }, [items, searchQuery, filterBy, citySearch, selectedCity]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };
  const isInitialLoading =
    !items.length && (isLoadingAll || isLoadingRecommended);
  if (isInitialLoading) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Hospitality...</p>
          </div>
        </div>
      </section>
    );
  }

  const showError = !items.length && (errorAll || isRecommendedError);
  if (showError) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load Hospitality</p>
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
          All Hospitality{" "}
          <span className="bg-primary/10 p-1.5 px-3 rounded-lg">
            {filteredAndSortedItems.length}
          </span>
        </h1>
      </div>
      {/* Search Bar */}
      <div className="mb-4">
        <form className="relative" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search gift stores..."
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
          { key: "all", label: "All", count: items.length },
          { key: "recent", label: "Recent", count: items.length },
          {
            key: "active",
            label: "Active",
            count: items.filter(
              (r: { status: string }) => r.status === "active"
            ).length,
          },
          {
            key: "inactive",
            label: "Inactive",
            count: items.filter(
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
            Showing {filteredAndSortedItems.length} result(s) for "
            {searchQuery}"
          </p>
        </div>
      )}{" "}
      {/* Restaurant Cards Grid */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSortedItems.map(
            (item: any, index: number) => (
              <RestaurantCard
                key={index}
                id={item.id || item.title}
                title={item.title}
                image={item.image}
                rating={item.rating || 0}
                price={item.price}
                status={item.status as "active" | "inactive"}
                city={item.city}
                state={item.state}
                category="hospitality"
              />
            )
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No Hospitality found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No made in nigeria available at the moment"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ViewAllHospitality;
