/**
 * Token Utility Functions for BookBox Restaurant Application
 * Provides encoding and decoding functionality for JWT tokens
 */

/**
 * Encodes a token using Base64 encoding
 * @param token - The JWT token to encode
 * @returns Encoded token string
 */
export const encodeToken = (token: string): string => {
  try {
    // Convert string to base64
    const encoded = btoa(token);
    return encoded;
  } catch (error) {
    console.error("Error encoding token:", error);
    throw new Error("Failed to encode token");
  }
};

/**
 * Decodes a Base64 encoded token
 * @param encodedToken - The encoded token to decode
 * @returns Decoded token string
 */
export const decodeToken = (encodedToken: string): string => {
  try {
    // Convert base64 back to string
    const decoded = atob(encodedToken);
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    throw new Error("Failed to decode token");
  }
};

/**
 * Validates if a token is properly formatted (basic JWT structure check)
 * @param token - The token to validate
 * @returns True if token appears to be a valid JWT format
 */
export const isValidTokenFormat = (token: string): boolean => {
  try {
    // Basic JWT format check: should have 3 parts separated by dots
    const parts = token.split(".");
    return parts.length === 3;
  } catch (error) {
    console.error(error)
    return false;

  }
};

/**
 * Safely encodes a token with validation
 * @param token - The token to encode
 * @returns Encoded token or null if invalid
 */
export const safeEncodeToken = (token: string): string | null => {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }
    
    // Optional: Validate token format before encoding
    if (!isValidTokenFormat(token)) {
      console.warn("Token does not appear to be in valid JWT format");
    }
    
    return encodeToken(token);
  } catch (error) {
    console.error("Safe encode token failed:", error);
    return null;
  }
};

/**
 * Safely decodes a token with error handling
 * @param encodedToken - The encoded token to decode
 * @returns Decoded token or null if invalid
 */
export const safeDecodeToken = (encodedToken: string): string | null => {
  try {
    if (!encodedToken || typeof encodedToken !== "string") {
      return null;
    }
    
    return decodeToken(encodedToken);
  } catch (error) {
    console.error("Safe decode token failed:", error);
    return null;
  }
};

/**
 * Token validation helper that checks if token exists and is properly encoded
 * @param encodedToken - The encoded token to validate
 * @returns Object with validation results
 */
export const validateEncodedToken = (encodedToken: string): {
  isValid: boolean;
  decodedToken: string | null;
  error?: string;
} => {
  try {
    if (!encodedToken) {
      return {
        isValid: false,
        decodedToken: null,
        error: "No token provided",
      };
    }

    const decodedToken = safeDecodeToken(encodedToken);
    
    if (!decodedToken) {
      return {
        isValid: false,
        decodedToken: null,
        error: "Failed to decode token",
      };
    }

    if (!isValidTokenFormat(decodedToken)) {
      return {
        isValid: false,
        decodedToken,
        error: "Invalid token format",
      };
    }

    return {
      isValid: true,
      decodedToken,
    };
  } catch (error) {
    return {
      isValid: false,
      decodedToken: null,
      error: error instanceof Error ? error.message : "Unknown validation error",
    };
  }
};
