import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SearchService, type SearchResult } from "@/services/searchService";
import { useSearchContext } from "./useSearchContext";

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  restaurantId?: string; // For menu search context
}

export interface UseSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  placeholder: string;
  handleSearch: (query: string) => void;
  handleResultClick: (result: SearchResult) => void;
  handleSearchSubmit: (e: React.FormEvent) => void;
  clearSearch: () => void;
  searchContext: ReturnType<typeof useSearchContext>;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const navigate = useNavigate();
  const searchContext = useSearchContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  // Debounced search function
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < minQueryLength) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);

      try {
        let results: SearchResult[] = [];

        // Always use global search for comprehensive results
        // This allows users to find everything regardless of current page context
        results = await SearchService.globalSearch(query);

        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [minQueryLength]
  );

  // Debounce effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch, debounceMs]);

  // Handle search input change
  const handleSearch = useCallback((query: string) => {
    // Clean hashtags from the query
    const cleanedQuery = cleanSearchQuery(query);
    setSearchQuery(cleanedQuery);
  }, []);

  // Handle result click
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      navigate(result.route);
      setSearchQuery(""); // Clear search after navigation
      setSearchResults([]);
    },
    [navigate]
  );

  // Handle search form submission
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (searchResults.length > 0) {
        // Navigate to first result
        handleResultClick(searchResults[0]);
      } else if (searchQuery.trim()) {
        // Navigate to search results page based on context
        const searchRoute = getSearchResultsRoute(searchContext, searchQuery);
        if (searchRoute) {
          navigate(searchRoute);
        }
      }
    },
    [searchResults, searchQuery, searchContext, handleResultClick, navigate]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSearch,
    searchResults,
    isSearching,
    placeholder: searchContext.placeholder,
    handleSearch,
    handleResultClick,
    handleSearchSubmit,
    clearSearch,
    searchContext,
  };
}

// Helper function to get search results route based on context
function getSearchResultsRoute(
  _searchContext: ReturnType<typeof useSearchContext>,
  query: string
): string | null {
  const encodedQuery = encodeURIComponent(query);

  if (_searchContext.type === "menus" && _searchContext?.restaurantId) {
    // If searching within a restaurant's menu
    return `/restaurants/${_searchContext.restaurantId}/menu?search=${encodedQuery}`;
  }

  if (_searchContext.type === "gifts") {
    // If searching for gifts
    return `/gifts?search=${encodedQuery}`;
  }

  if (_searchContext.type === "bookings") {
    // If searching for bookings
    return `/bookings?search=${encodedQuery}`;
  }

  if (_searchContext.type === "tickets") {
    // If searching for tickets
    return `/tickets?search=${encodedQuery}`;
  }
  // Add more context types as needed
  return `/restaurants/view-all?search=${encodedQuery}`;
}

// Helper function to clean search query from hashtags and other unwanted characters
function cleanSearchQuery(query: string): string {
  if (!query) return query;

  return query
    .replace(/#/g, "") // Remove hashtags
    .replace(/[@]/g, "") // Remove @ symbols
    .trim(); // Remove leading/trailing whitespace
}
