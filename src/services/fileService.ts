/* eslint-disable @typescript-eslint/no-explicit-any */
import { uploadFile } from "./apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";

export interface ImageUploadResponse {
  success: boolean;
  message: string;
  url: string;
  public_id: string;
}

export interface ImageUploadError {
  success: false;
  message: string;
  error?: string;
}

export const fileService = {
  /**
   * Upload an image file to the server
   * @param file The image file to upload
   * @param additionalData Optional additional data to send with the upload
   * @returns Promise<ImageUploadResponse>
   */
  uploadImage: async (
    file: File,
    additionalData?: Record<string, any>
  ): Promise<ImageUploadResponse> => {
    try {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed");
      }

      // Validate file size (20MB limit as mentioned in the UI)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      if (file.size > maxSize) {
        throw new Error("File size must be less than 20MB");
      }
      console.log("Uploading image:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        additionalData,
      });
      const response = await uploadFile<ImageUploadResponse>(
        API_ENDPOINTS.FILES.UPLOAD_IMAGE,
        file,
        additionalData
      );
      console.log("Image upload response:", response);

      // Check if response has the expected structure
      if (!response) {
        console.error("No response received:", response);
        throw new Error("No response from server");
      } // If response has data property, use it; otherwise use response directly
      const uploadData = response.data || response;

      // Validate that we have the required properties
      if (
        !uploadData ||
        typeof uploadData !== "object" ||
        !("url" in uploadData)
      ) {
        console.error("Invalid upload response structure:", uploadData);
        throw new Error("Invalid upload response format");
      }

      return uploadData as ImageUploadResponse;
    } catch (error: any) {
      console.error("Image upload failed:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        stack: error?.stack,
      });

      // Provide more specific error messages based on error type
      if (error?.message?.includes("401")) {
        throw new Error("Authentication failed. Please sign in again.");
      } else if (error?.message?.includes("500")) {
        throw new Error("Server error occurred. Please try again later.");
      } else if (error?.message?.includes("413")) {
        throw new Error("File too large. Please choose a smaller file.");
      }

      throw new Error(
        error?.message || "Failed to upload image. Please try again."
      );
    }
  },

  /**
   * Validate image file before upload
   * @param file The file to validate
   * @returns Object with validation result
   */
  validateImageFile: (file: File): { isValid: boolean; error?: string } => {
    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      return {
        isValid: false,
        error: "Only image files (JPG, PNG, etc.) are allowed",
      };
    }

    // Check file size (20MB limit)
    const maxSize = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size must be less than 20MB",
      };
    }

    // Check for supported formats
    const supportedFormats = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!supportedFormats.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        error: "Only JPG, PNG, and WebP formats are supported",
      };
    }

    return { isValid: true };
  },

  /**
   * Format file size for display
   * @param bytes File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },
};
