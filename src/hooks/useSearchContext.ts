/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export interface SearchContext {
  type: "global";
  placeholder: string;
  baseRoute: string;
}

export function useSearchContext(): SearchContext {
  const location = useLocation();

  const searchContext = useMemo((): SearchContext => {
    const pathname = location.pathname;

    // All searches use the global unified search endpoint
    return {
      type: "global",
      placeholder: "Search businesses, products, tickets, bookings...",
      baseRoute: pathname,
    };
  }, [location.pathname]);

  return searchContext;
}