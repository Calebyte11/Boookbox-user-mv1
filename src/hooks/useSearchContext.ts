/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export interface SearchContext {
  restaurantId: boolean;
  type: "restaurants" | "tickets" | "gifts" | "bookings" | "menus" | "default";
  placeholder: string;
  searchFunction?: (query: string) => Promise<any[]>;
  baseRoute?: string;
}

export function useSearchContext(): SearchContext {
  const location = useLocation();

  const searchContext = useMemo((): SearchContext => {
    const pathname = location.pathname;

    // Always use global search with consistent placeholder
    // This ensures users can search for everything regardless of current page
    return {
      type: "default",
      placeholder: "Search restaurants, tickets, gifts, bookings, users...",
      baseRoute: pathname,
      restaurantId: false,
    };
  }, [location.pathname]);

  return searchContext;
}
