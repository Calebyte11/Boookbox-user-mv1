import { useState, useEffect } from "react";
import {
  getRememberMe,
  setRememberMe as setRememberMeStorage,
} from "@/utils/storageUtils";

/**
 * Custom hook for managing remember me functionality
 * @returns Object with rememberMe state and setter function
 */
export const useRememberMe = () => {
  const [rememberMe, setRememberMeState] = useState<boolean>(() =>
    getRememberMe()
  );

  const setRememberMe = (remember: boolean) => {
    setRememberMeState(remember);
    setRememberMeStorage(remember);
  };

  // Sync with storage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "bookbox-remember-me") {
        setRememberMeState(e.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return {
    rememberMe,
    setRememberMe,
  };
};
