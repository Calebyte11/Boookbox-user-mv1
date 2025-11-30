/* eslint-disable @typescript-eslint/no-explicit-any */

import useAuthStore from "@/store/authStore";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = 'https://boookbox-backend-cpvu.onrender.com') {
    this.baseURL = baseURL;
  }

  // ======== THE ORIGINAL ======
  // constructor(baseURL: string = import.meta.env.VITE_API_BASE_URL || "") {
  //   this.baseURL = baseURL;
  // }
  /**
   * Get authorization headers with token if available
   */
  private getAuthHeaders(): Record<string, string> {
    const { getDecodedToken, hasValidAuth, isTokenValid, logout } =
      useAuthStore.getState();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Validate authentication state
    if (!hasValidAuth() || !isTokenValid()) {
      console.error("API Client: Invalid authentication state, logging out");
      logout();
      throw new Error("Authentication required");
    }

    const token = getDecodedToken();
    if (!token) {
      console.error("API Client: No valid token available, logging out");
      logout();
      throw new Error("Authentication token not available");
    }

    headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }

  /**
   * Get public headers (no authentication required)
   */
  private getPublicHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
    };
  }

  /**
   * Handle authentication errors from API responses
   */
  private async handleAuthError(response: Response): Promise<void> {
    if (response.status === 401 || response.status === 403) {
      const { logout } = useAuthStore.getState();
      try {
        await logout();
        // Small delay to ensure state is fully cleared before redirect
        setTimeout(() => {
          window.location.replace("/auth/login");
        }, 100);
      } catch (error) {
        console.error("Error during logout:", error);
        // Force redirect even if logout fails
        window.location.replace("/auth/login");
      }
    }
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        await this.handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API GET error:", error);
      throw error;
    }
  }
  /**
   * Make public GET request (no authentication required)
   */
  async getPublic<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const fullUrl = `${this.baseURL}${endpoint}`;
      console.log(`Making public GET request to: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: this.getPublicHeaders(),
      });

      // console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // console.log(`Response data:`, data);
      return data;
    } catch (error) {
      console.error("API public GET error:", error);
      throw error;
    }
  }

  /**
   * Make authenticated POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        await this.handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API POST error:", error);
      throw error;
    }
  }

  /**
   * Make authenticated PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        await this.handleAuthError(response);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API PUT error:", error);
      throw error;
    }
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API DELETE error:", error);
      throw error;
    }
  }

  /**
   * Make authenticated PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API PATCH error:", error);
      throw error;
    }
  }

  /**
   * Upload file with authentication
   */ async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append("image", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      const { getDecodedToken, hasValidAuth } = useAuthStore.getState();
      const headers: Record<string, string> = {};

      console.log("Upload file - Auth check:", {
        hasValidAuth: hasValidAuth(),
        hasToken: !!getDecodedToken(),
        endpoint,
        fileName: file.name,
        fileSize: file.size,
      });

      // Ensure authentication is valid for this protected endpoint
      if (!hasValidAuth()) {
        throw new Error(
          "Authentication required. Please sign in to upload files."
        );
      }

      const token = getDecodedToken();
      if (!token) {
        throw new Error("Invalid authentication token. Please sign in again.");
      }

      headers["Authorization"] = `Bearer ${token}`;
      console.log("Added authorization header with token");

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });

      console.log("Upload response status:", response.status);
      console.log(
        "Upload response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `HTTP error! status: ${response.status} - ${
            errorText || response.statusText
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API file upload error:", error);
      throw error;
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Export individual methods for convenience with proper this binding
export const get = <T>(endpoint: string) => apiClient.get<T>(endpoint);
export const getPublic = <T>(endpoint: string) =>
  apiClient.getPublic<T>(endpoint);
export const post = <T>(endpoint: string, data?: any) =>
  apiClient.post<T>(endpoint, data);
export const put = <T>(endpoint: string, data?: any) =>
  apiClient.put<T>(endpoint, data);
export const patch = <T>(endpoint: string, data?: any) =>
  apiClient.patch<T>(endpoint, data); // Using PATCH for patching as per original code
export const del = <T>(endpoint: string) => apiClient.delete<T>(endpoint);
export const uploadFile = <T>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
) => apiClient.uploadFile<T>(endpoint, file, additionalData);
