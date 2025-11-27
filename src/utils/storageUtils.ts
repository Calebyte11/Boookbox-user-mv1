/**
 * Storage utilities for handling remember me functionality
 */

export const STORAGE_KEYS = {
  AUTH_STORAGE: "users-auth-storage",
  REMEMBER_ME: "bookbox-remember-me",
} as const;

const isBrowser = typeof window !== 'undefined';

// A dummy storage object for SSR environment
const dummyStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

/**
 * Get the appropriate storage based on remember me preference
 * @returns localStorage if remember me is true, sessionStorage otherwise
 */
export const getStorage = (): Storage => {
  if (!isBrowser) return dummyStorage;

  const rememberMe = window.localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);

  // Default to sessionStorage for security
  if (rememberMe === "true") {
    return window.localStorage;
  }

  return window.sessionStorage;
};

/**
 * Set the remember me preference
 * @param remember - Whether to remember the user
 */
export const setRememberMe = (remember: boolean): void => {
  if (isBrowser) {
    window.localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString());
  }
};

/**
 * Get the remember me preference
 * @returns Whether the user wants to be remembered
 */
export const getRememberMe = (): boolean => {
  if (!isBrowser) return false;
  const rememberMe = window.localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
  return rememberMe === "true";
};

/**
 * Clear all storage data (for logout)
 */
export const clearAllStorage = (): void => {
  if (!isBrowser) return;

  // Clear auth data from both storages
  window.localStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
  window.sessionStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);

  // Clear remember me preference
  window.localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);

  // Clear session storage completely
  window.sessionStorage.clear();
};

/**
 * Migrate auth data between storages when remember me preference changes
 * @param remember - New remember me preference
 */
export const migrateAuthStorage = (remember: boolean): void => {
  if (!isBrowser) return;

  const currentStorage = getStorage();
  const newStorage = remember ? window.localStorage : window.sessionStorage;

  // Only migrate if storages are different
  if (currentStorage !== newStorage) {
    const authData = currentStorage.getItem(STORAGE_KEYS.AUTH_STORAGE);

    if (authData) {
      // Move data to new storage
      newStorage.setItem(STORAGE_KEYS.AUTH_STORAGE, authData);
      // Clear from old storage
      currentStorage.removeItem(STORAGE_KEYS.AUTH_STORAGE);
    }
  }

  // Update remember me preference
  setRememberMe(remember);
};
