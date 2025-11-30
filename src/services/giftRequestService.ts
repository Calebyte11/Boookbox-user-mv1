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


import { ApiClient } from "./apiClient";
// import { API_ENDPOINTS } from "@/config/endpoints";

export interface GiftRequestProduct {
  _id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  price: number;
  image?: string;
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

export interface GiftRequestData {
  _id: string;
  user: GiftRequestUser;
  business: GiftRequestBusiness;
  product: GiftRequestProduct;
  status: string;
  quantity: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  accountType: GiftRequestUser["accountType"];
  organizationName?: GiftRequestUser["organizationName"];
}

export interface GiftRequestResponse {
  success: boolean;
  data: GiftRequestData;
}

const apiClient = new ApiClient();

export const giftRequestService = {
  /**
   * Fetch gift request details by ID
   */
  async getGiftRequestById(requestId: string): Promise<GiftRequestResponse> {
    try {
      console.log("Fetching gift request with ID:", requestId);
      
      // ApiClient returns the gift request data directly, not wrapped in another response object
      const response = await apiClient.get<GiftRequestData>(
        `/u/gifting/requests/find?id=${requestId}`
      );
      
      console.log("Raw API Request response:", response.data);
      
      if (!response.data) {
        throw new Error("No data received from server");
      }
      
      // response.data is already the GiftRequestData object
      const giftRequestData = response.data;
      
      // Validate the gift request data has required fields
      if (!giftRequestData._id || !giftRequestData.user || !giftRequestData.business || !giftRequestData.product) {
        throw new Error("Invalid gift request data structure");
      }
      
      // Wrap it in the expected response format
      return {
        success: true,
        data: giftRequestData
      };
      
    } catch (error) {
      console.error("Failed to fetch gift request:", error);
      
      // Handle network errors specifically
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Unable to connect to server. Please check your internet connection or try again later.");
      }
      
      throw error;
    }
  },
};