import { useLayoutEffect } from 'react';

/**
 * Scroll restoration utilities for BoookBox PWA
 * Handles various scroll scenarios with iOS PWA compatibility
 */

/**
 * Immediately scroll to top with multiple fallbacks
 * Most reliable method for instant scroll restoration
 */
export const scrollToTopImmediate = () => {
  try {
    // Primary method - modern browsers
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
  } catch {
    // Fallback for older browsers
    try {
      window.scrollTo(0, 0);
    } catch {
      // Final fallback - direct DOM manipulation
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
    }
  }
};

/**
 * Delayed scroll to top - useful for iOS PWA where immediate scroll might be interrupted
 */
export const scrollToTopDelayed = (delay: number = 50) => {
  setTimeout(() => {
    scrollToTopImmediate();
  }, delay);
};

/**
 * Comprehensive scroll restoration that tries multiple approaches
 */
export const restoreScrollPosition = () => {
  // Immediate scroll
  scrollToTopImmediate();
  
  // Also try after a small delay for iOS PWA compatibility
  scrollToTopDelayed(50);
  
  // Final attempt after DOM updates
  requestAnimationFrame(() => {
    scrollToTopImmediate();
  });
};

/**
 * Hook to restore scroll position with useLayoutEffect for maximum reliability
 */
export const useScrollPositionRestore = (dependencies: React.DependencyList = []) => {
  useLayoutEffect(() => {
    restoreScrollPosition();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

export default {
  scrollToTopImmediate,
  scrollToTopDelayed,
  restoreScrollPosition,
  useScrollPositionRestore
};
