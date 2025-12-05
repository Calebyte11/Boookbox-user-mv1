// // import { ApiClient } from "./apiClient"; // Adjust this import based on your API client setup
// // // import { API_ENDPOINTS } from "@/config/endpoints";

// // export interface GiftRequestProduct {
// //   _id: string;
// //   name: string;
// //   type: string;
// //   category: string;
// //   description: string;
// //   price: number;
// //   image?: string;
// // }

// // export interface GiftRequestBusiness {
// //   _id: string;
// //   name: string;
// //   category: string;
// //   profileImage: string;
// //   paymentCurrency: string;
// // }

// // export interface GiftRequestUser {
// //   _id: string;
// //   fullName: string;
// //   email: string;
// //   profileImage: string;
// //   accountType: string;
// //   phoneNumber: string;
// //   organizationName?: string;
// // }

// // export interface GiftRequestData {
// //   _id: string;
// //   user: GiftRequestUser;
// //   business: GiftRequestBusiness;
// //   product: GiftRequestProduct;
// //   status: string;
// //   quantity: number;
// //   totalAmount: number;
// //   currency: string;
// //   createdAt: string;
// //   updatedAt: string;
// // }

// // export interface GiftRequestResponse {
// //   success: boolean;
// //   data: GiftRequestData;
// // }

// // const apiClient = new ApiClient();

// // export const giftRequestService = {
// //   /**
// //    * Fetch gift request details by ID
// //    */
// //   async getGiftRequestById(requestId: string): Promise<GiftRequestResponse> {
// //     try {
// //       const response = await apiClient.get<GiftRequestResponse>(
// //         `/u/gifting/requests/find?id=${requestId}`
// //       );
      
// //       // The response from apiClient.get is wrapped, so we access .data
// //       // and cast it to ensure TypeScript knows it's the right type
// //       return response.data as GiftRequestResponse;
// //     } catch (error) {
// //       console.error("Failed to fetch gift request:", error);
// //       throw error;
// //     }
// //   },
// // };



// import { ApiClient } from "./apiClient";
// // import { API_ENDPOINTS } from "@/config/endpoints";

// export interface GiftRequestProduct {
//   _id: string;
//   name: string;
//   type: string;
//   category: string;
//   description: string;
//   price: number;
//   image?: string;
// }

// export interface GiftRequestBusiness {
//   _id: string;
//   name: string;
//   category: string;
//   profileImage: string;
//   paymentCurrency: string;
// }

// export interface GiftRequestUser {
//   _id: string;
//   fullName: string;
//   email: string;
//   profileImage: string;
//   accountType: string;
//   phoneNumber: string;
//   organizationName?: string;
// }

// export interface GiftRequestData {
//   _id: string;
//   user: GiftRequestUser;
//   business: GiftRequestBusiness;
//   product: GiftRequestProduct;
//   status: string;
//   quantity: number;
//   totalAmount: number;
//   currency: string;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface GiftRequestResponse {
//   success: boolean;
//   data: GiftRequestData;
// }

// const apiClient = new ApiClient();

// export const giftRequestService = {
//   /**
//    * Fetch gift request details by ID
//    */
//   async getGiftRequestById(requestId: string): Promise<GiftRequestResponse> {
//     try {
//       console.log("Fetching gift request with ID:", requestId);
      
//       // ApiClient.get returns ApiResponse<T>, which has a .data property
//       const response = await apiClient.get<GiftRequestResponse>(
//         `/u/gifting/requests/find?id=${requestId}`
//       );
      
//       console.log("Raw API response:", response);
      
//       // Check if the API call was successful
//       if (!response.data) {
//         throw new Error("No data received from server");
//       }
      
//       // response.data is your GiftRequestResponse
//       const giftRequestResponse = response.data;
      
//       // Check if the backend response indicates success
//       if (!giftRequestResponse.success) {
//         throw new Error("Server returned unsuccessful response");
//       }
      
//       if (!giftRequestResponse.data) {
//         throw new Error("No gift request data in response");
//       }
      
//       return giftRequestResponse;
      
//     } catch (error) {
//       console.error("Failed to fetch gift request:", error);
//       console.error("Error details:", {
//         message: error instanceof Error ? error.message : "Unknown error",
//         stack: error instanceof Error ? error.stack : undefined,
//         error
//       });
//       throw error;
//     }
//   },
// };

// giftRequestService.ts - Updated interfaces

import { ApiClient } from "./apiClient";

export interface GiftRequestProduct {
  _id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  price: number;
  images?: string[]; // API returns array of images
}

export interface GiftRequestBusiness {
  _id: string;
  name: string;
  category: string;
  profileImage: string;
  paymentCurrency: string;
}

export interface GiftRequestUser {
  _id: string;
  fullName: string;
  email: string;
  profileImage: string;
  accountType: string;
  phoneNumber: string;
  organizationName?: string;
}

// Public response (without authentication)
export interface GiftRequestDataPublic {
  _id: string;
  business: GiftRequestBusiness;
  product: GiftRequestProduct;
  quantity: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  // NO status field
  // NO user field
  // NO updatedAt field
}

// Authenticated response (with bearer token)
export interface GiftRequestDataAuth {
  _id: string;
  user: GiftRequestUser; // Only in authenticated response
  business: GiftRequestBusiness;
  product: GiftRequestProduct;
  status: string; // Only in authenticated response
  quantity: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  // Still no updatedAt field in your API
}

// Union type for components that might receive either
export type GiftRequestData = GiftRequestDataPublic | GiftRequestDataAuth;

// Type guard to check if data is authenticated
export function isAuthenticatedGiftRequest(
  data: GiftRequestData
): data is GiftRequestDataAuth {
  return 'status' in data && 'user' in data;
}

export interface GiftRequestResponsePublic {
  success: boolean;
  data: GiftRequestDataPublic;
}

export interface GiftRequestResponseAuth {
  success: boolean;
  data: GiftRequestDataAuth;
}

const apiClient = new ApiClient();

export const giftRequestService = {
  /**
   * Fetch gift request details by ID (authenticated users)
   * Returns: user, status, and all other fields
   */
  async getGiftRequestById(requestId: string): Promise<GiftRequestResponseAuth> {
    try {
      console.log("🔐 [AUTH] Fetching gift request with ID:", requestId);
      
      const response = await apiClient.get<GiftRequestDataAuth>(
        `/u/gifting/requests/find?id=${requestId}`
      );
      
      console.log("🔐 [AUTH] Raw API response:", response);
      console.log("🔐 [AUTH] Response data:", response.data);
      
      if (!response.data) {
        throw new Error("No data received from server");
      }
      
      const giftRequestData = response.data;
      
      // Validate authenticated response fields
      if (!giftRequestData._id || !giftRequestData.user || !giftRequestData.business || !giftRequestData.product || !giftRequestData.status) {
        console.error("🔐 [AUTH] Missing required fields:", {
          hasId: !!giftRequestData._id,
          hasUser: !!giftRequestData.user,
          hasBusiness: !!giftRequestData.business,
          hasProduct: !!giftRequestData.product,
          hasStatus: !!giftRequestData.status
        });
        throw new Error("Invalid authenticated gift request data structure");
      }
      
      console.log("✅ [AUTH] All required fields present");
      
      return {
        success: true,
        data: giftRequestData
      };
      
    } catch (error) {
      console.error("🔐 [AUTH] Failed to fetch gift request:", error);
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to server. Please check your internet connection or try again later.");
      }
      
      throw error;
    }
  },

  /**
   * Fetch gift request details by ID (public/visitors)
   * Returns: NO user field, NO status field
   */
  async getGiftRequestByIdPublic(requestId: string): Promise<GiftRequestResponsePublic> {
    try {
      console.log("🌐 [PUBLIC] Fetching gift request with ID:", requestId);
      const url = `/u/gifting/requests/find?id=${requestId}`;
      console.log("🌐 [PUBLIC] Request URL:", url);
      
      const response = await apiClient.getPublic<GiftRequestDataPublic>(url);
      
      console.log("🌐 [PUBLIC] Raw API response:", response);
      console.log("🌐 [PUBLIC] Response type:", typeof response);
      console.log("🌐 [PUBLIC] Response keys:", Object.keys(response || {}));
      console.log("🌐 [PUBLIC] Response.data:", response?.data);
      
      // Check if response.data exists and has the gift request structure
      let giftRequestData: GiftRequestDataPublic;
      
      if (response?.data) {
        // If data is nested in response.data
        console.log("🌐 [PUBLIC] Using response.data");
        giftRequestData = response.data;
      } else if (response && '_id' in response) {
        // If the response itself IS the gift request data
        console.log("🌐 [PUBLIC] Response IS the gift request data");
        giftRequestData = response as unknown as GiftRequestDataPublic;
      } else {
        console.error("🌐 [PUBLIC] Invalid response structure:", response);
        throw new Error("Invalid response structure from server");
      }
      
      console.log("🌐 [PUBLIC] Extracted gift request data:", giftRequestData);
      console.log("🌐 [PUBLIC] Data validation:", {
        hasId: !!giftRequestData._id,
        hasBusiness: !!giftRequestData.business,
        hasProduct: !!giftRequestData.product,
        hasQuantity: typeof giftRequestData.quantity === 'number',
        hasTotalAmount: typeof giftRequestData.totalAmount === 'number',
        hasCurrency: !!giftRequestData.currency,
        hasCreatedAt: !!giftRequestData.createdAt
      });
      
      // Validate essential fields for public response
      if (!giftRequestData._id || !giftRequestData.business || !giftRequestData.product || 
          typeof giftRequestData.quantity !== 'number' || typeof giftRequestData.totalAmount !== 'number') {
        console.error("🌐 [PUBLIC] Missing required fields:", {
          hasId: !!giftRequestData._id,
          hasBusiness: !!giftRequestData.business,
          hasProduct: !!giftRequestData.product,
          hasQuantity: typeof giftRequestData.quantity === 'number',
          hasTotalAmount: typeof giftRequestData.totalAmount === 'number'
        });
        throw new Error("Invalid gift request data structure");
      }
      
      console.log("✅ [PUBLIC] Gift request validation passed");
      console.log("ℹ️ [PUBLIC] Note: 'user' and 'status' fields not included in public response");
      
      return {
        success: true,
        data: giftRequestData
      };
      
    } catch (error) {
      console.error("❌ [PUBLIC] Failed to fetch gift request:");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
      console.error("Error object:", error);
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to server. Please check your internet connection or try again later.");
      }
      
      throw error;
    }
  }
};