/* eslint-disable @typescript-eslint/no-explicit-any */
import { API_ENDPOINTS } from "@/config/endpoints";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUpdateProfile } from "./profileService";
// Base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
import useAuthStore from "@/store/authStore";
export interface ImageUploadResponse {
  message: string;
  imageUrl: string;
  publicId?: string;
  url?: string;
}

/**
 * Upload an image file to the server
 * @param file - The image file to upload
 * @returns Promise containing the upload response
 */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  try {
    const { getDecodedToken } = useAuthStore.getState();
    const formData = new FormData();
    formData.append("image", file);

    // Get auth token from localStorage
    const token = getDecodedToken();

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.FILES.UPLOAD_IMAGE}`,
      {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Upload failed" }));
      throw new Error(
        errorData.message || `Upload failed with status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Image upload error:", error);
    throw error instanceof Error ? error : new Error("Failed to upload image");
  }
}

/**
 * Update user profile with new image URL
 * @param imageUrl - The URL of the uploaded image
 * @returns Promise containing the update response
 */
export async function updateProfileImage(imageUrl: string): Promise<any> {
  const { getDecodedToken, updateUser } = useAuthStore.getState();

  try {
    const token = getDecodedToken();

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE.UPDATE}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ profileImage: imageUrl }),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Profile update failed" }));
      throw new Error(
        errorData.message ||
          `Profile update failed with status: ${response.status}`
      );
    }

    const data = await response.json();
    // Update the auth store with the new profile image
    updateUser({
      profileImage: imageUrl,
      photoURL: imageUrl, // Also update photoURL for compatibility
    });

    return data;
  } catch (error) {
    console.error("Profile image update error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to update profile image");
  }
}

/**
 * Upload image and update user profile in one operation
 * @param file - The image file to upload
 * @returns Promise containing the final profile update response
 */
export async function uploadAndUpdateProfileImage(file: File): Promise<any> {
  const { getDecodedToken, updateUser } = useAuthStore.getState();

  try {
    // First upload the image
    const uploadResponse = await uploadImage(file);
    const token = getDecodedToken();

    // Get current profile data to preserve all fields
    const profileResponse = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE.GET}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch current profile");
    }

    const currentProfile = await profileResponse.json();
    console.log("Current profile structure:", currentProfile);

    // Prepare the update payload - only send the profileImage field
    const updatePayload = {
      profileImage: uploadResponse.url,
    };

    console.log("Update payload:", updatePayload);

    // Update the profile with the new image URL
    const updateResponse = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE.UPDATE}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(updatePayload),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse
        .json()
        .catch(() => ({ message: "Profile update failed" }));
      throw new Error(
        errorData.message ||
          `Profile update failed with status: ${updateResponse.status}`
      );
    }

    const finalResponse = await updateResponse.json();
    console.log("Profile update response:", finalResponse);

    // Update the auth store with the new profile image
    updateUser({
      profileImage: uploadResponse.url,
    });

    return {
      ...finalResponse,
      imageUrl: uploadResponse.url,
    };
  } catch (error) {
    console.error("Upload and update profile image error:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to upload and update profile image");
  }
}

/**
 * Hook for uploading image and updating profile using React Query
 * This ensures proper cache invalidation and auth store updates
 */
export function useUploadAndUpdateProfileImage() {
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();
  const { updateUser } = useAuthStore.getState();

  return useMutation({
    mutationFn: async (file: File) => {
      // First upload the image
      const uploadResponse = await uploadImage(file);

      // Then update the profile using the proper service
      const profileUpdateResponse = await updateProfile.mutateAsync({
        profileImage: uploadResponse.url,
      });

      return {
        ...profileUpdateResponse,
        imageUrl: uploadResponse.url,
      };
    },
    onSuccess: (data) => {
      // Update auth store with new profile image
      updateUser({
        profileImage: data.imageUrl,
        photoURL: data.imageUrl, // Also update photoURL for compatibility
      });

      // Invalidate profile queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      console.log("Profile image updated successfully");
    },
    onError: (error) => {
      console.error("Failed to upload and update profile image:", error);
    },
  });
}
