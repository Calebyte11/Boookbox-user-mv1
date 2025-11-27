import useAuthStore from "@/store/authStore";

/**
 * Handles authentication errors (401 or 403 status codes) consistently across the application.
 * Logs the user out and redirects to the login page.
 * 
 * @param response - The fetch response object to check
 * @param source - Optional source identifier for logging purposes
 * @returns boolean - true if an auth error was handled, false otherwise
 */
export const handleAuthError = (response: Response, source = "API"): boolean => {
  if (response.status === 401 || response.status === 403) {
    console.warn(`Authentication error (${response.status}) detected in ${source}`);
    
    // Get the logout function from the auth store and call it
    useAuthStore.getState().logout();
    
    // Redirect to login page
    window.location.replace("/login");
    
    return true;
  }
  
  return false;
};
