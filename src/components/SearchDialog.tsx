import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  Settings2,
  Search,
  X,
  History,
  Loader2,
} from "lucide-react";
import ActivityHero from  "@/assets/images/sponsorbanner.png"
import type { SearchResult } from "@/services/searchService";

interface SearchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchHistory: string[];
  onSearchSubmit: (event: React.FormEvent) => void;
  onRecentSearchClick: (item: string) => void;
  onOpenFilterDialog: () => void;
  placeholder?: string;
  searchResults?: SearchResult[];
  isSearching?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onOpenChange,
  searchQuery,
  onSearchQueryChange,
  searchHistory,
  onSearchSubmit,
  onRecentSearchClick,
  onOpenFilterDialog,
  placeholder = "Search...",
  searchResults = [],
  isSearching = false,
  onResultClick,
}) => {
  // Helper function to clean search input
  const handleInputChange = (value: string) => {
    // Allow typing hashtags but clean them when processing
    const cleanedValue = value.replace(/[@]/g, ""); // Remove @ symbols immediately
    onSearchQueryChange(cleanedValue);

    console.log(searchResults);
    
  };

  // Log search results for debugging
  React.useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      console.log("🔍 SearchDialog Debug:", {
        searchQuery,
        isSearching,
        resultsCount: searchResults.length,
        results: searchResults,
      });
    }
  }, [searchQuery, searchResults, isSearching]);
  console.log(searchResults);
  

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 md:hidden" />
        <Dialog.Content className="fixed left-0 right-0 top-0 h-auto min-h-[30vh] max-h-[90vh] overflow-y-auto z-50 bg-white p-4 focus:outline-none md:hidden">
          {/* Add DialogTitle for accessibility */}
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          
          <div className="flex items-center justify-between my-4">
            <Dialog.Close className="rounded-xl p-2 bg-[#ECE6F0]">
              <ChevronLeft className="h-6 w-6 text-black text-xl" />
            </Dialog.Close>
            <h1 className="text-2xl">Search</h1>
            <div
              className="rounded-xl p-2 bg-[#ECE6F0] cursor-pointer"
              onClick={onOpenFilterDialog}
            >
              <Settings2 className="h-6 w-6 text-black text-xl" />
            </div>
          </div>
          
          <form onSubmit={onSearchSubmit} className="relative">
            <input
              type="text"
              placeholder={placeholder}
              className="w-full rounded-xl bg-[#ECE6F0] py-3 px-10 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F]" />
            {searchQuery && (
              <X
                className="absolute right-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F] cursor-pointer"
                onClick={() => onSearchQueryChange("")}
              />
            )}
          </form>
          
          {/* Search Results */}
          {searchQuery.trim() && searchQuery.length >= 2 && (
            <div className="mt-6">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin h-6 w-6 text-primary" />
                  <span className="ml-2 text-gray-600">Searching...</span>
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                <div>
                  <h3 className="text-xl font-medium text-black mb-4">
                    Search Results ({searchResults.length})
                  </h3>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.type}-${result.id}-${index}`}
                        className="py-3 px-2 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center space-x-3"
                        onClick={() => {
                          console.log("Clicking result:", result);
                          onResultClick?.(result);
                        }}
                      >
                        {result.image && (
                          <img
                            src={result.image || ActivityHero}
                            alt={result.title}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              // Hide broken images
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-gray-900 truncate flex-1">
                              {result.title}
                            </p>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary flex-shrink-0">
                              {result.type}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {result.description}
                          </p>
                          
                          {/* Display business info for products */}
                          {result.type === "product" && result.metadata?.businessName && (
                            <p className="text-xs text-gray-400 mt-1">
                              📍 {result.metadata.businessName}
                            </p>
                          )}
                          
                          {/* Display price for products */}
                          {result.type === "product" && result.metadata?.price && (
                            <p className="text-sm font-semibold text-primary mt-1">
                              {result.metadata.currency} {result.metadata.price.toLocaleString()}
                            </p>
                          )}
                          
                          {/* Display category badges */}
                          {result.metadata?.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                              {result.metadata.category}
                            </span>
                          )}
                          
                          {/* Display kitchen type and cuisine type if available */}
                          {(result.metadata?.kitchenType ||
                            result.metadata?.cuisineType) && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.metadata.kitchenType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                                  {result.metadata.kitchenType}
                                </span>
                              )}
                              {result.metadata.cuisineType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                                  {Array.isArray(result.metadata.cuisineType)
                                    ? result.metadata.cuisineType.join(", ")
                                    : result.metadata.cuisineType}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Display tags if available */}
                          {result.metadata?.tags &&
                            Array.isArray(result.metadata.tags) &&
                            result.metadata.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.metadata.tags
                                  .slice(0, 3)
                                  .map((tag: string, tagIndex: number) => (
                                    <span
                                      key={`tag-${tagIndex}`}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                {result.metadata.tags.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{result.metadata.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">
                    No results found for "{searchQuery}"
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try different keywords or check your spelling
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Recent Searches - Show only when no search query */}
          {!searchQuery.trim() && searchHistory.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xl font-medium text-black mb-4 mt-3">
                Recent Searches
              </h3>
              <div className="space-y-2">
                {searchHistory.map((item, index) => (
                  <div
                    key={`history-${index}`}
                    className="py-3 hover:bg-gray-100 rounded-lg cursor-pointer inline-flex justify-between w-full items-center px-2"
                    onClick={() => onRecentSearchClick(item)}
                  >
                    <span className="inline-flex capitalize items-center">
                      <History className="h-6 w-6 mr-2" />
                      {item}
                    </span>
                    <X className="h-6 w-6" />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty state - Show when no search query and no history */}
          {!searchQuery.trim() && searchHistory.length === 0 && (
            <div className="mt-6 text-center text-gray-500 py-8">
              <History className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No recent searches.</p>
              <p className="text-sm text-gray-400 mt-1">
                Start typing to search for businesses, products, and more
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SearchDialog;