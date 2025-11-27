import { useGet, useUpdate } from "@/features/sponsor/useApi";
import { API_ENDPOINTS } from "@/config/endpoints";

// Profile data interfaces based on API swagger documentation
export interface UserProfile {
  _id: string;
  fullName: string;
  occupation?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  profileImage?: string; // Profile image URL
  accountType: "user" | "organization";
  contactEmail?: string; // Only for organization accounts
  organizationName?: string; // Only for organization accounts
  category: string; // Only for organization accounts
  birthday?: {
    day?: number;
    month?:
      | "jan"
      | "feb"
      | "mar"
      | "apr"
      | "may"
      | "jun"
      | "jul"
      | "aug"
      | "sep"
      | "oct"
      | "nov"
      | "dec";
    year?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phoneNumber?: string;
  profileImage?: string; // Profile image URL  contactEmail?: string; // Only for organization accounts
  organizationName?: string; // Only for organization accounts
  category?: string; // Only for organization accounts
  birthday?: {
    day: number;
    month: string; // Lowercase abbreviated month like "jan", "feb", etc.
  };
  // Optional gender field
  gender?: string;
  // Optional account type for switching between user and organization
  accountType?: "user" | "organization";
}

export interface ProfileResponse {
  message: string;
  user: UserProfile;
}

/**
 * Hook to fetch user profile data
 * @returns React Query result with user profile data
 */
export function useGetProfile() {
  return useGet<ProfileResponse>(["profile"], API_ENDPOINTS.USER_PROFILE.GET, {
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update user profile
 * @returns React Query mutation for updating profile
 */
export function useUpdateProfile() {
  return useUpdate<ProfileResponse, UpdateProfileRequest>(
    API_ENDPOINTS.USER_PROFILE.UPDATE,
    {
      onSuccess: (data) => {
        // console.log("Profile updated successfully:", data.message);

        // Trigger a custom event that can be listened to by auth store
        if (data.user) {
          window.dispatchEvent(
            new CustomEvent("profile:updated", {
              detail: data.user,
            })
          );
        }

        // Invalidate profile query to refetch fresh data
        // This will be handled by the useUpdate hook automatically
      },
      onError: (error) => {
        console.error("Failed to update profile:", error.message);
      },
      // Optimistic updates for better UX
      onMutate: async (newData) => {
        // You can implement optimistic updates here if needed
        // console.log("Starting profile update:", newData);
        if(!newData){
          return
        }
      },
    }
  );
}
