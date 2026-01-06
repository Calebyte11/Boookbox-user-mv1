/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AlertCircle, Search } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Button from "@/components/Button";
import RestaurantCard from "@/components/RestaurantCard";
import { useNavigate } from "react-router-dom";
import { useAllMadeInNigeriaQuery, useRecommendedMadeInNigeriaQuery } from "@/hooks/useMadeInNigeriaQueries";
import { useLocationStore } from "@/store/locationStore";
import { formatCurrency } from "@/utils/formatCurrency";

const ViewAllMadeInNigeria = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "recent" | "active" | "inactive" | "city">("all");
  const [citySearch, setCitySearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const locationStore = useLocationStore();

  const { data: allData, isLoading: isLoadingAll, error: errorAll } = useAllMadeInNigeriaQuery();

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

  const { data: recommendedData, isLoading: isLoadingRecommended } = useRecommendedMadeInNigeriaQuery(
    coords?.lat,
    coords?.lng,
    "made-in-nigeria",
  );

  const data = useMemo(() => {
    if (Array.isArray(recommendedData) && recommendedData.length > 0) {
      return recommendedData as any;
    }
    return allData as any;
  }, [recommendedData, allData]);

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
      const id = item.madeInNigeriaId || item._id || item.businessId || item.id || "";

      return {
        id,
        title: item.name || "Made in Nigeria",
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
        price: `${formatCurrency(minPrice, paymentCurrency)} - ${formatCurrency(maxPrice, paymentCurrency)}`,
      };
    });
  }, [data]);

  const cityList = useMemo(() => {
    const cities = items.map((r: any) => r.city?.trim()).filter(Boolean);
    return Array.from(new Set(cities)).sort();
  }, [items]);

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

  const handleNavigateToDetail = (id: string) => {
    if (id) navigate(`/made-in-nigeria/${id}`);
  };

  const isLoading = isLoadingAll || isLoadingRecommended;
  const error = errorAll;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search Made in Nigeria products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button variant={filterBy === "all" ? "primary" : "secondary"} onClick={() => { setFilterBy("all"); setSelectedCity(""); }} className="text-sm">All</Button>
            <Button variant={filterBy === "active" ? "primary" : "secondary"} onClick={() => { setFilterBy("active"); setSelectedCity(""); }} className="text-sm">Active</Button>
            <Button variant={filterBy === "inactive" ? "primary" : "secondary"} onClick={() => { setFilterBy("inactive"); setSelectedCity(""); }} className="text-sm">Inactive</Button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button variant={filterBy === "city" ? "primary" : "secondary"} className="text-sm">City {selectedCity && `(${selectedCity})`}</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content className="w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <div className="mb-2">
                  <input type="text" placeholder="Search cities..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {cityList.map((city) => (
                    <DropdownMenu.Item key={city} onClick={() => { setFilterBy("city"); setSelectedCity(city); }} className="px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 rounded">{city}</DropdownMenu.Item>
                  ))}
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading && (<div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div><p className="mt-4 text-gray-600">Loading products...</p></div>)}
        {error && (<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"><AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" /><div><h3 className="font-semibold text-red-900">Error loading products</h3><p className="text-sm text-red-700 mt-1">{error instanceof Error ? error.message : "Please try again later"}</p></div></div>)}
        {!isLoading && filteredAndSortedItems.length === 0 && (<div className="text-center py-12"><p className="text-gray-600 text-lg">No products found</p></div>)}
        {!isLoading && filteredAndSortedItems.length > 0 && (<><p className="text-gray-600 mb-6">Showing {filteredAndSortedItems.length} product{filteredAndSortedItems.length !== 1 ? "s" : ""}</p><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filteredAndSortedItems.map((item: any) => (<div key={item.id} onClick={() => handleNavigateToDetail(item.id)}><RestaurantCard id={item.id} title={item.title} image={item.image} rating={item.rating} price={item.price} city={item.city} /></div>))}</div></>) }
      </div>
    </div>
  );
};

export default ViewAllMadeInNigeria;
