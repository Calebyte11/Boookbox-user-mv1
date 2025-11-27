import * as React from "react";

// A router-agnostic scroll-to-top hook that listens to history navigation events.
// Works on initial mount, pushState/replaceState, and back/forward (popstate).
export function useScrollToTop(containerId?: string, excludePaths?: string[]) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Disable browser's built-in scroll restoration for consistent behavior
    if ("scrollRestoration" in window.history) {
      try {
        window.history.scrollRestoration = "manual";
      } catch {
        // ignore if not supported
      }
    }

    const shouldExcludeCurrentPath = () => {
      if (!excludePaths || excludePaths.length === 0) return false;
      const currentPath = window.location.pathname;
      return excludePaths.some(excludePath => currentPath.startsWith(excludePath));
    };

    const scroll = () => {
      // Skip scroll restoration if current path is in exclude list
      if (shouldExcludeCurrentPath()) return;
      
      if (containerId) {
        const el = document.getElementById(containerId);
        if (el) el.scrollTop = 0;
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    };

    // Scroll on initial mount (page load/refresh)
    scroll();

    // Patch history methods to emit a custom event on navigation
  const origPushState = window.history.pushState;
  const origReplaceState = window.history.replaceState;
  const boundPushState = origPushState.bind(window.history);
  const boundReplaceState = origReplaceState.bind(window.history);

    const dispatchLocationChange = () => {
      window.dispatchEvent(new Event("locationchange"));
    };

    const patchedPushState: History["pushState"] = function (_data: unknown, _unused: string, _url?: string | URL | null) {
      const data = _data as unknown;
      const unused = _unused as string;
      const url = _url as string | URL | null | undefined;
      boundPushState(data as never, unused, url as never);
      dispatchLocationChange();
    };
    // Assign with cast to satisfy TS
    (window.history.pushState as History["pushState"]) = patchedPushState;

    const patchedReplaceState: History["replaceState"] = function (_data: unknown, _unused: string, _url?: string | URL | null) {
      const data = _data as unknown;
      const unused = _unused as string;
      const url = _url as string | URL | null | undefined;
      boundReplaceState(data as never, unused, url as never);
      dispatchLocationChange();
    };
    (window.history.replaceState as History["replaceState"]) = patchedReplaceState;

    // Listen to back/forward and our custom navigation events
    const onPopState = () => scroll();
    const onLocationChange = () => scroll();

    window.addEventListener("popstate", onPopState);
    window.addEventListener("locationchange", onLocationChange);

    // Cleanup: restore originals and remove listeners
    return () => {
      window.history.pushState = origPushState;
      window.history.replaceState = origReplaceState;
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("locationchange", onLocationChange);
    };
  }, [containerId, excludePaths]);
}
