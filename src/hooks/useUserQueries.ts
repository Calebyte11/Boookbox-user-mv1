/* eslint-disable @typescript-eslint/no-explicit-any */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { usersService } from "@/services/usersService";
import useAuthStore from "@/store/authStore";

// --- QUERY KEYS ---
export const queryKeys = {
  Auth: {
    profile: () => ["user", "profile"] as const,
  },
  UserSearch: {
    search: (query: string) => ["user", "search", query] as const,
  },
  Bookings: {
    all: (params?: any) => ["bookings", "all", params] as const,
    self: (params?: any) => ["bookings", "self", params] as const,
    others: (params?: any) => ["bookings", "others", params] as const,
    gifts: (params?: any) => ["bookings", "gifts", params] as const,
    public: (params?: any) => ["bookings", "public", params] as const,
    nearby: (params?: any) => ["bookings", "nearby", params] as const,
    detail: (bid: string) => ["bookings", "detail", bid] as const,
    verifyPayment: (bid: string) =>
      ["bookings", "verify-payment", bid] as const,
  },
  Tickets: {
    all: (params?: any) => ["tickets", "all", params] as const,
    detail: (tid: string) => ["tickets", "detail", tid] as const,
  },
};

// --- AUTH HOOKS ---
export function useRegisterUser() {
  return useMutation({ mutationFn: usersService.register });
}
export function useLoginUser() {
  return useMutation({ mutationFn: usersService.login });
}
// export function useGoogleOneTapAuth() {
//   return useMutation({ mutationFn: usersService.googleOneTapAuth });
// }
export function useSendVerfCodeToEmail() {
  return useMutation({ mutationFn: usersService.sendVerfCodeToEmail });
}
export function useVerifyEmail() {
  return useMutation({ mutationFn: usersService.verifyEmail });
}
export function useSendPasswordResetCode() {
  return useMutation({ mutationFn: usersService.sendPasswordResetCode });
}
export function useVerifyPasswordResetCode() {
  return useMutation({ mutationFn: usersService.verifyPasswordResetCode });
}
export function useResetPassword() {
  return useMutation({ mutationFn: usersService.resetPassword });
}
export function useLogoutUser() {
  return useMutation({ mutationFn: usersService.logout });
}

// --- PROFILE HOOKS ---
export function useUserProfileQuery() {
  const { updateUser, hasValidAuth, syncProfileToAuth } = useAuthStore();

  const query = useQuery<any>({
    queryKey: queryKeys.Auth.profile(),
    queryFn: () => {
      console.log("🔍 Fetching user profile...");
      return usersService.getUserProfile();
    },
    enabled: hasValidAuth(), // Only run if user is authenticated
  });

  // Sync auth store with fresh profile data when query succeeds
  useEffect(() => {
    if (query.data?.success && query.data?.data) {
      // console.log(
      //   "🔄 Syncing complete profile data to auth store:",
      //   query.data.data
      // );

      // Use the new syncProfileToAuth method for comprehensive sync
      syncProfileToAuth(query.data.data);

      // Also update basic fields for backward compatibility
      updateUser({
        isVerified: query.data.data.isVerified,
        id: query.data.data._id,
        email: query.data.data.email,
        username: query.data.data.fullName,
      });
    }
  }, [query.data, updateUser, syncProfileToAuth]);

  return query;
}
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const { syncProfileToAuth } = useAuthStore();

  return useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: (data) => {
      // Invalidate and refetch profile query
      queryClient.invalidateQueries({ queryKey: queryKeys.Auth.profile() });

      // Immediately sync updated data to auth store if available
      if (data?.success && data?.data) {
        // console.log("🔄 Profile updated successfully, syncing to auth store:", data.data);
        syncProfileToAuth(data.data);
      } else if (data?.user) {
        // Handle different response formats
        // console.log("🔄 Profile updated successfully, syncing to auth store:", data.user);
        syncProfileToAuth(data.user);
      }
    },
  });
}

// --- USER SEARCH HOOKS ---
export function useSearchUsers(query: string, options?: { enabled?: boolean }) {
  const { hasValidAuth } = useAuthStore();
  
  return useQuery({
    queryKey: queryKeys.UserSearch.search(query),
    queryFn: () => usersService.searchUsers(query),
    enabled: hasValidAuth() && !!query.trim() && (options?.enabled !== false),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
  });
}

// --- BOOKINGS HOOKS ---
export function useAllBookingsQuery(params?: any) {
  const { hasValidAuth } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.Bookings.all(params),
    queryFn: () => usersService.getAllBookings2(params),
    enabled: hasValidAuth(), // Only run if user is authenticated
    refetchOnWindowFocus: true, // Refetch when window becomes active
  });
}
export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersService.createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });

      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });
      // Also invalidate the specific booking detail
    },

    onError: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });

      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });
      // Also invalidate the specific booking detail
    },
  });
}
export function useUpdateBooking(bid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => usersService.updateBooking(bid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.Bookings.detail(bid),
        refetchType: "active", // Force immediate refetch for active queries
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      // Also force refetch to ensure immediate update
      queryClient.refetchQueries({
        queryKey: queryKeys.Bookings.detail(bid),
      });
    },
  });
}
export function useDeleteBooking(bid: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => usersService.deleteBooking(bid),
    onSuccess: () => {
      // Invalidate all booking-related queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });
      // Force remove the specific booking detail from cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.Bookings.detail(bid),
        refetchType: "active",
      });
      // Force refetch active queries
      queryClient.refetchQueries({
        queryKey: queryKeys.Bookings.detail(bid),
      });
    },
  });
}
export function useClaimBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersService.claimBookingWithQRCode,
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.Tickets.all() });
    },
  });
}
export function usePayForBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: { bid: string; body: any }) =>
      usersService.payForBooking(variables.bid, variables.body),
    onSuccess: (_data, variables) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });

      // Force refetch the specific booking detail immediately
      queryClient.invalidateQueries({
        queryKey: queryKeys.Bookings.detail(variables.bid),
        refetchType: "active", // Force immediate refetch for active queries
      });
      // Also force refetch to ensure immediate update
      queryClient.refetchQueries({
        queryKey: queryKeys.Bookings.detail(variables.bid),
      });
    },
  });
}

export function useInitializeBookingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersService.initializeBookingPayment,
    onSuccess: (_data, variables: any) => {
      // Invalidate all booking-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });
      // Invalidate the specific booking detail if bookingId is available
      if (variables?.bookingId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.Bookings.detail(variables.bookingId),
        });
      }
    },
  });
}
export function useVerifyPaymentQuery(
  bid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.Bookings.verifyPayment(bid),
    queryFn: () => usersService.verifyPayment(bid),
    enabled: options?.enabled !== undefined ? options.enabled : !!bid,
  });
}
export function useSelfBookingsQuery(params?: any) {
  const { hasValidAuth } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.Bookings.self(params),
    queryFn: () => usersService.getSelfBookings(params),
    enabled: hasValidAuth(), // Only run if user is authenticated
    refetchOnWindowFocus: true, // Refetch when window becomes active
  });
}
export function useOthersBookingsQuery(params?: any) {
  const { hasValidAuth } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.Bookings.others(params),
    queryFn: () => usersService.getOthersBookings(params),
    enabled: hasValidAuth(), // Only run if user is authenticated
    refetchOnWindowFocus: true, // Refetch when window becomes active
  });
}
export function useGiftedBookingsQuery(params?: any) {
  const { hasValidAuth } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.Bookings.gifts(params),
    queryFn: () => usersService.getGiftedBookings(params),
    enabled: hasValidAuth(), // Only run if user is authenticated
    refetchOnWindowFocus: true, // Refetch when window becomes active
  });
}
export function usePublicBookingsQuery(params?: any) {
  const { hasValidAuth } = useAuthStore();

  return useQuery({
    queryKey: queryKeys.Bookings.public(params),
    queryFn: () => usersService.getPublicBookings(params),
    enabled: hasValidAuth(), // Only run if user is authenticated
    refetchOnWindowFocus: true, // Refetch when window becomes active
  });
}
export function useNearbyBookingsQuery(
  params?: any,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.Bookings.nearby(params),
    queryFn: () => usersService.getNearbyBookings(params),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!params?.latitude && !!params?.longitude,
  });
}
export function useBookingDetailQuery(
  bid: string,
  options?: { enabled?: boolean }
) {
  const query = useQuery({
    queryKey: queryKeys.Bookings.detail(bid),
    queryFn: () => usersService.viewBooking(bid),
    enabled: options?.enabled !== undefined ? options.enabled : !!bid,
    refetchOnWindowFocus: true, // Refetch when window becomes active
    staleTime: 0, // Always consider data stale, allow immediate refetch
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes (formerly cacheTime)
  });

  return query;
}

// --- TICKETS HOOKS ---
export function useTicketsQuery(params?: any) {
  return useQuery({
    queryKey: queryKeys.Tickets.all(params),
    queryFn: () => usersService.getTickets(params),
  });
}
export function useTicketDetailQuery(
  tid: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.Tickets.detail(tid),
    queryFn: () => usersService.viewTicket(tid),
    enabled: options?.enabled !== undefined ? options.enabled : !!tid,
  });
}
// --- PAYMENT HOOKS ---
import type { ConfirmPaymentBody } from "@/services/usersService";
// import { useEffect } from "react";
export function useConfirmPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    // Accepts { ...ConfirmPaymentBody, bookingId?: string }
    mutationFn: async (
      variables: ConfirmPaymentBody & { bookingId?: string }
    ) => {
      // Call the actual confirmPayment API
      return usersService.confirmPayment(variables);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });

      // Force refetch the specific booking detail immediately
      if (variables?.bookingId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.Bookings.detail(variables.bookingId),
          refetchType: "active", // Force immediate refetch for active queries
        });
        // Also force refetch to ensure immediate update
        queryClient.refetchQueries({
          queryKey: queryKeys.Bookings.detail(variables.bookingId),
        });
      }
    },
    onError: (_error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.Bookings.all() });
      queryClient.invalidateQueries({ queryKey: ["bookings", "gifts"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "others"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "public"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "self"] });
      queryClient.invalidateQueries({ queryKey: ["bookings", "nearby"] });
      // Optionally also invalidate the detail on error
      if (variables?.bookingId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.Bookings.detail(variables.bookingId),
        });
      }
    },
  });
}
