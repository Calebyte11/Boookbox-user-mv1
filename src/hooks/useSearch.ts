import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SearchService, type SearchResult } from "@/services/searchService";
import { useSearchContext } from "./useSearchContext";

export interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  initialPage?: number;
  initialLimit?: number;
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
  page: number;
  setPage: (page: number) => void;
  hasMore: boolean;
  loadMore: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const { 
    debounceMs = 300, 
    minQueryLength = 2,
    initialPage = 1,
    initialLimit = 10
  } = options;

  const navigate = useNavigate();
  const searchContext = useSearchContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(false);

  /**
   * Perform search using the unified backend endpoint
   */
  const performSearch = useCallback(
    async (query: string, pageNum: number = 1) => {
      if (!query.trim() || query.length < minQueryLength) {
        setSearchResults([]);
        setHasMore(false);
        return;
      }

      setIsSearching(true);

      try {
        const results = await SearchService.search(query, pageNum, initialLimit);
        
        if (pageNum === 1) {
          setSearchResults(results);
          console.log(results);
          
        } else {
          // Append results for pagination
          setSearchResults((prev) => [...prev, ...results]);
        }
        
        // Determine if there are more results
        // You can adjust this logic based on your backend's pagination response
        setHasMore(results.length === initialLimit);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
        setHasMore(false);
      } finally {
        setIsSearching(false);
      }
    },
    [minQueryLength, initialLimit]
  );

  /**
   * Debounce effect for search query changes
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        setPage(1);
        performSearch(searchQuery, 1);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch, debounceMs]);

  /**
   * Handle search input change
   */
  const handleSearch = useCallback((query: string) => {
    const cleanedQuery = cleanSearchQuery(query);
    setSearchQuery(cleanedQuery);
    setPage(1);
  }, []);

  /**
   * Handle result click - navigate to the result's route
   */
  const handleResultClick = useCallback(
    (result: SearchResult) => {
      navigate(result.route);
      setSearchQuery("");
      setSearchResults([]);
      setPage(1);
    },
    [navigate]
  );

  /**
   * Handle search form submission
   */
  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (searchResults.length > 0) {
        // Navigate to first result
        handleResultClick(searchResults[0]);
      } else if (searchQuery.trim()) {
        // Navigate to search results page
        const searchRoute = `/search?q=${encodeURIComponent(searchQuery)}`;
        navigate(searchRoute);
      }
    },
    [searchResults, searchQuery, handleResultClick, navigate]
  );

  /**
   * Clear search state
   */
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setPage(1);
    setHasMore(false);
  }, []);

  /**
   * Load more results (pagination)
   */
  const loadMore = useCallback(() => {
    if (!isSearching && hasMore && searchQuery) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(searchQuery, nextPage);
    }
  }, [isSearching, hasMore, searchQuery, page, performSearch]);

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
    page,
    setPage,
    hasMore,
    loadMore,
  };
}

/**
 * Helper function to clean search query from hashtags and other unwanted characters
 */
function cleanSearchQuery(query: string): string {
  if (!query) return query;

  return query
    .replace(/#/g, "")
    .replace(/[@]/g, "")
    .trim();
}