import useAuthStore from "@/store/authStore";

/**
 * Get authorization headers with token if available
 */
export const getAuthHeaders = (): Record<string, string> => {
  const { getDecodedToken, hasValidAuth } = useAuthStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!hasValidAuth()) {
    throw new Error("User is not authenticated");
  }

  const token = getDecodedToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Get public headers (no authentication required)
 */
export const getPublicHeaders = (): Record<string, string> => {
  return {
    "Content-Type": "application/json",
  };
};
