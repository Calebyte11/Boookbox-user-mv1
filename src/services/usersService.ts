/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  API_ENDPOINTS,
  type BookingId,
  type TicketId,
} from "@/config/endpoints";
import useAuthStore from "@/store/authStore";
import { apiClient } from "./apiClient";
import { generateTicketQRCodeWithLogo } from "@/utils/qrCode";


// ======= FOR PROCUTION ====== Base URL for API calls=======
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


// --- Type Definitions ---
export type RegisterBody = {
  fullName: string;
  email: string;
  password: string;
  accountType?: "user" | "organization";
  organizationName?: string;
  contactEmail?: string;
};
export type LoginBody = { email: string; password: string };

// ✅ UPDATED: Added rememberMe
export type GoogleOneTapBody = {
  credential: string;
  environmentInfo: any;
  rememberMe?: boolean;
};

export type EmailBody = { email: string };
export type VerifyEmailBody = { email: string; code: string };
export type PasswordResetSendCodeBody = { email: string };
export type PasswordResetVerifyCodeBody = {
  email: string;
  code?: string;
  otp?: string;
};
export type PasswordResetBody = {
  email: string;
  newPassword: string;
  token?: string;
};

export type UserSearchResult = {
  fullName: string;
  email: string;
  profileImage?: string;
  accountType: "user" | "organization";
  phoneNumber: string;
  organizationName?: string;
  contactEmail?: string;
};

export type SearchUsersResponse = {
  success: boolean;
  count: number;
  data: UserSearchResult[];
};
export type BookingCreateBody = {
  bookingType: string;
  bookedFor: {
    type: string;
    contact?: Array<{
      name: string;
      email: string;
      phoneNumber: string;
      remark?: string;
    }>;
    remark?: string;
  };
  restaurantId: string;
  menuItems: { 
    menuId: string; 
    quantity: number; 
    instructions?: string;
    customizations?: Array<{
      type: string;
      value: string;
    }>;
  }[];
  numberOfBookings: number;
  reason?: string;
  validityDate?: string;
  tags?: string[];
  redemptionMode?: string;
  includeUtensils?: boolean;
  deliveryType?: string;
};
export type BookingUpdateBody = Partial<BookingCreateBody>;
export type BookingPayBody = {
  paymentMethod: "card" | "cash" | "mobile";
  cardDetails?: {
    cardNumber?: string;
    expiryDate?: string;
    cvv?: string;
    cardHolderName?: string;
  };
  amount?: number;
};

export type InitializeBookingPaymentBody = {
  bookingId: string;
  paymentReference: string;
  provider?: string;
  paymentType?: string;
  serviceFee?: number;
  tax?: number;
};

export type ConfirmPaymentBody = {
  transactionId: string;
  paymentReference: string;
  flutterwaveResponse: any;
};

// --- Helper Function ---
function getHeaders(auth = false, isJson = true) {
  const headers: Record<string, string> = {};
  if (isJson) headers["Content-Type"] = "application/json";
  if (auth) {
    const { getDecodedToken, hasValidAuth } = useAuthStore.getState();

    if (!hasValidAuth()) {
      throw new Error("User is not authenticated");
    }

    const token = getDecodedToken();

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.error("❌ No token available for authorization");
      throw new Error("No authentication token available");
    }
  }
  return headers;
}

// --- Service Functions ---
export const usersService = {
  // Auth endpoints
  register: (body: RegisterBody) =>
    fetch(API_ENDPOINTS.USER_AUTH.REGISTER, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  login: (body: LoginBody) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.LOGIN}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  // ✅ UPDATED: googleAuth now includes rememberMe
  googleAuth: (body: GoogleOneTapBody) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.GOOGLE}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        credential: body.credential,
        environmentInfo: body.environmentInfo,
        rememberMe: body.rememberMe ?? false,
      }),
    }).then((res) => res.json()),

  // ✅ UPDATED: facebookAuth now includes rememberMe
  facebookAuth: (body: GoogleOneTapBody) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.FACEBOOK}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        credential: body.credential,
        environmentInfo: body.environmentInfo,
        rememberMe: body.rememberMe ?? false,
      }),
    }).then((res) => res.json()),

  sendVerfCodeToEmail: (body: EmailBody) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.SEND_VERIFICATION_EMAIL}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      if (!text) {
        return {
          success: true,
          message: "Verification code sent successfully",
        };
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        console.log(error);
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid response format");
      }
    }),

  verifyEmail: (body: VerifyEmailBody) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.VERIFY_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const text = await res.text();
      if (!text) {
        return { success: true, message: "Email verified successfully" };
      }

      try {
        return JSON.parse(text);
      } catch (error) {
        console.log(error);
        console.error("Failed to parse JSON response:", text);
        throw new Error("Invalid response format");
      }
    }),

  sendPasswordResetCode: (body: PasswordResetSendCodeBody) =>
    fetch(
      `${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.PASSWORD_RESET_SEND_CODE}`,
      {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
      }
    ).then((res) => res.json()),

  // verifyPasswordResetCode: (body: PasswordResetVerifyCodeBody) =>
  //   fetch(
  //     `${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.PASSWORD_RESET_VERIFY_CODE}`,
  //     {
  //       method: "POST",
  //       headers: getHeaders(),
  //       body: JSON.stringify({
  //         email: body.email,
  //         code: body.otp,
  //       }),
  //     }
  //   ).then((res) => res.json()),
  // Add this updated method to your usersService object

  verifyPasswordResetCode: async (body: PasswordResetVerifyCodeBody) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.PASSWORD_RESET_VERIFY_CODE}`;

      // Ensure we're sending the correct payload structure
      const payload = {
        email: body.email,
        code: body.code || body.otp, // Support both 'code' and 'otp' parameter names
      };

      console.log("🔍 Verifying password reset code:");
      console.log("URL:", url);
      console.log("Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const responseText = await response.text();
      console.log("Response text:", responseText);

      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response format from server");
      }

      console.log("Parsed response data:", JSON.stringify(data, null, 2));

      // Handle different response scenarios
      if (!response.ok) {
        // Server returned an error status
        const errorMessage =
          data.message ||
          data.error ||
          `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      // Check if backend explicitly said the code is invalid
      if (data.success === false) {
        throw new Error(data.message || "Invalid or expired reset code");
      }

      // Success case
      return data;
    } catch (error) {
      console.error("❌ Error in verifyPasswordResetCode:", error);
      throw error;
    }
  },

  resetPassword: (body: PasswordResetBody) =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.PASSWORD_RESET_RESET}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${body.token}`,
      },
      body: JSON.stringify({
        email: body.email,
        newPassword: body.newPassword,
      }),
    }).then((res) => res.json()),

  logout: () =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_AUTH.LOGOUT}`, {
      method: "POST",
      headers: getHeaders(true),
    }).then((res) => res.json()),

  // Profile
  getProfile: () =>
    fetch(`${API_BASE_URL}${API_ENDPOINTS.USER_PROFILE.GET}`, {
      headers: getHeaders(true),
    }),

  getUserProfile: async () => {
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.USER_PROFILE.GET}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  updateProfile: (body: any) =>
    fetch(API_ENDPOINTS.USER_PROFILE.UPDATE, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(body),
    }).then((res) => res.json()),

  // User Search
  searchUsers: async (query: string): Promise<SearchUsersResponse> => {
    if (!query.trim()) {
      return { success: true, count: 0, data: [] };
    }

    try {
      const response = await apiClient.get(
        API_ENDPOINTS.USER_SEARCH.SEARCH_USERS(query)
      );
      return response as any;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },

  // Bookings
  getAllBookings: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    fetch(
      `${API_ENDPOINTS.BOOKINGS.GET_ALL}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`,
      { headers: getHeaders(true) }
    ).then((res) => res.json()),

  getAllBookings2: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    apiClient
      .get(
        `${API_ENDPOINTS.BOOKINGS.GET_ALL}${
          params ? `?${new URLSearchParams(params as any).toString()}` : ""
        }`
      )
      .then((res) => res.data),

  createBooking: async (body: BookingCreateBody) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CREATE}`,
        {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.text();
          if (errorData) {
            try {
              const jsonError = JSON.parse(errorData);
              errorMessage =
                jsonError.message || jsonError.error || errorMessage;
            } catch {
              errorMessage = errorData;
            }
          }
        } catch {
          // Use default error message
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error("Create booking error:", error);
      throw error;
    }
  },

  updateBooking: async (bid: BookingId, body: BookingUpdateBody) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.UPDATE(bid)}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: getHeaders(true),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 404) {
          throw new Error("Booking not found");
        }

        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating booking:", error);
      throw error;
    }
  },

  deleteBooking: async (bid: BookingId) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.DELETE(bid)}`;

      const response = await fetch(url, {
        method: "DELETE",
        headers: getHeaders(true),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 404) {
          throw new Error("Booking not found");
        }

        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Booking deleted successfully:", data);
      return data;
    } catch (error) {
      console.error("Error deleting booking:", error);
      throw error;
    }
  },

  claimBookingWithQRCode: async (bid: BookingId) => {
    const { user } = useAuthStore.getState();
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CLAIM(bid)}`;
      console.log("🎯 Claiming booking with QR code generation:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(true),
      });

      const claimData = await response.json();

      try {
        if (!user) {
          throw new Error("User is not authenticated");
        }

        const ticketId =
          claimData.data?.bookingId || claimData.data?._id || bid;
        const qrCodeDataURL = await generateTicketQRCodeWithLogo(ticketId);

        const qrCodeData = {
          qrCodeDataURL,
          generatedAt: new Date().toISOString(),
          ticketId,
        };

        const updatedClaimData = {
          ...claimData,
          data: {
            ...claimData.data,
            qrCode: qrCodeData,
          },
        };

        console.log("✅ QR Code generated and added to booking data");
        return updatedClaimData;
      } catch (qrError) {
        console.error("Error generating QR code:", qrError);
        return claimData;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to claim booking");
      } else {
        throw new Error("Failed to claim booking");
      }
    }
  },

  payForBooking: async (bid: BookingId, body: BookingPayBody) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.PAY(bid)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);

        if (response.status === 404) {
          throw new Error("Booking not found");
        }

        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      throw error;
    }
  },

  initializeBookingPayment: async (body: InitializeBookingPaymentBody) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.INITIALIZE_PAYMENT}`;

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error(
          "Initialize booking payment response not ok:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);

        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }
      const data = await response.json();
      console.log("✅ Booking payment initialized successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error initializing booking payment:", error);
      throw error;
    }
  },

  confirmPayment: async (body: ConfirmPaymentBody) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CONFIRM_PAYMENT}`;
      const payload = {
        status: body.flutterwaveResponse,
        tx_ref: body.paymentReference,
        transaction_id: body.transactionId,
      };
      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status} - ${errorText}`;
        if (errorText.includes("Unknown status")) {
          errorMessage = `Payment status '${body.flutterwaveResponse?.status}' not recognized by backend. Expected: 'completed', 'failed', or 'pending'. ${errorText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      console.log("✅ Payment confirmed successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error confirming payment:", error);
      throw error;
    }
  },

  // Paystack-specific payment confirmation
  confirmPaystackPayment: async (txRef: string) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.CONFIRM_PAYMENT}`;
      const payload = {
        payload: {
          status: "completed",
          tx_ref: txRef,
        },
        provider: "paystack",
      };

      console.log("🔄 Confirming Paystack payment:", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Paystack payment confirmation failed:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Paystack payment confirmed successfully:", data);
      return data;
    } catch (error) {
      console.error("❌ Error confirming Paystack payment:", error);
      throw error;
    }
  },

  // usersService.ts - PART 2 OF 2
  // Add these methods to the usersService object from Part 1

  verifyPayment: async (
    bid?: BookingId,
    options?: { paymentReference?: string }
  ) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.VERIFY_PAYMENT}`;

      const response = await fetch(url, {
        headers: getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Payment verification data:", data);
        return data;
      }

      console.error(
        "Verify payment response not ok:",
        response.status,
        response.statusText
      );
      const errorText = await response.text();
      console.error("Error response:", errorText);

      const shouldFallbackToPost =
        (response.status === 404 && /Cannot\s+GET/i.test(errorText)) ||
        response.status === 405;

      if (shouldFallbackToPost) {
        const fallbackUrl = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.VERIFY_PAYMENT_POST}`;
        const payload: Record<string, unknown> = { bookingId: bid };

        if (options?.paymentReference) {
          payload.paymentReference = options.paymentReference;
        }

        console.warn(
          "Legacy verify payment endpoint unavailable. Attempting fallback POST endpoint:",
          fallbackUrl
        );

        const fallbackResponse = await fetch(fallbackUrl, {
          method: "POST",
          headers: getHeaders(true),
          body: JSON.stringify(payload),
        });

        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error(
            "Fallback verify payment response not ok:",
            fallbackResponse.status,
            fallbackResponse.statusText
          );
          console.error("Fallback error response:", fallbackErrorText);

          if (fallbackResponse.status === 404) {
            throw new Error("Booking not found");
          }

          throw new Error(
            `HTTP error! status: ${fallbackResponse.status} - ${fallbackErrorText}`
          );
        }

        const fallbackData = await fallbackResponse.json();
        console.log("✅ Payment verification data (fallback):", fallbackData);
        return fallbackData;
      }

      if (response.status === 404) {
        throw new Error("Booking not found");
      }

      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    } catch (error) {
      console.error("❌ Error verifying payment:", error);
      throw error;
    }
  },

  // Bookings (filtered)
  getSelfBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      const url = `${API_ENDPOINTS.BOOKINGS.SELF}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`;

      const response = await apiClient.get(url).then((res) => res);
      return response;
    } catch (error) {
      console.error("❌ Error fetching self bookings:", error);
      throw error;
    }
  },

  getOthersBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      const url = `${API_ENDPOINTS.BOOKINGS.OTHERS}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`;

      const response = await apiClient.get(url).then((res) => res);
      return response;
    } catch (error) {
      console.log(error);
    }
  },

  getGiftedBookings: async (params?: { page?: number; limit?: number }) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.GIFTS}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`;
      console.log("🔍 Fetching gifted bookings from:", url);

      const response = await fetch(url, { headers: getHeaders(true) });

      if (!response.ok) {
        console.error(
          "Gifted bookings response not ok:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("❌ Error fetching gifted bookings:", error);
      throw error;
    }
  },

  getPublicBookings: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      const url = `${API_ENDPOINTS.BOOKINGS.PUBLIC}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`;
      console.log("🔍 Fetching public bookings from:", url);

      const response = await apiClient.get(url).then((res) => res);
      return response;
    } catch (error) {
      console.error("❌ Error fetching public bookings:", error);
      throw error;
    }
  },

  getNearbyBookings: async (params?: {
    page?: number;
    limit?: number;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.BOOKINGS.NEARBY}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`;
      console.log("🔍 Fetching nearby bookings from:", url);

      const response = await fetch(url, { headers: getHeaders(true) });

      if (!response.ok) {
        console.error(
          "Nearby bookings response not ok:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ Nearby bookings data:", data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching nearby bookings:", error);
      throw error;
    }
  },

  viewBooking: async (bid: BookingId) => {
    try {
      const url = `${API_ENDPOINTS.BOOKINGS.VIEW(bid)}`;
      console.log("🔍 Fetching booking details from:", url);

      const response = await apiClient.get(url).then((res) => res.data);
      return response;
    } catch (error) {
      return error;
    }
  },

  // Tickets
  getTickets: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get(
      `${API_ENDPOINTS.TICKETS.GET_ALL}${
        params ? `?${new URLSearchParams(params as any).toString()}` : ""
      }`
    ),

  viewTicket: async (tid: TicketId) => {
    try {
      const url = `${API_ENDPOINTS.TICKETS.VIEW(tid)}`;

      const response = await apiClient.get(url).then((res) => res);
      const data = response;
      return data;
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      throw error;
    }
  },

  // User Search
  findUser: async (query: string) => {
    try {
      const url = `${API_BASE_URL}${
        API_ENDPOINTS.FIND_USER
      }?query=${encodeURIComponent(query)}`;
      console.log("🔍 Searching for users:", url);

      const response = await fetch(url, { headers: getHeaders(true) });

      if (!response.ok) {
        console.error(
          "User search response not ok:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Error response:", errorText);

        if (response.status === 404) {
          return { data: [] };
        }

        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("✅ User search results:", data);
      return data;
    } catch (error) {
      console.error("❌ Error searching users:", error);
      throw error;
    }
  },
};
