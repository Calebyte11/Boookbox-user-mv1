import { useMutation } from '@tanstack/react-query';
import useAuthStore from "@/store/authStore";

// Define the request payload interface
interface CreateGiftRequestPayload {
  productId: string;
  businessId: string;
  quantity: number;
  totalAmount: number;
  message: string;
}

// Define the API response interface
interface CreateGiftRequestResponse {
  success: boolean;
  message: string;
  data: {
    requestId: string;
    shareableLink: string;
  };
  shareableLink: string; // Also at root level for easier access
}

// API call function using fetch
const createGiftRequest = async (
  payload: CreateGiftRequestPayload
): Promise<CreateGiftRequestResponse> => {

// ===== FOR PRODUCTION =====
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http:localhost:5000';

// ===== FOR DEVELOPMENT =====
    // const baseUrl = "https://boookbox-backend-cpvu.onrender.com";
  

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

  const response = await fetch(`${baseUrl}/u/gifting/requests/create`, {
    method: 'POST',
    headers: getHeaders(true),
    // credentials: 'include', // Include cookies/auth tokens
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: 'Failed to create gift request',
    }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data: CreateGiftRequestResponse = await response.json();
  return data;
};

// React Query hook
export const useCreateGiftRequest = () => {
  return useMutation({
    mutationFn: createGiftRequest,
    onSuccess: (data) => {
      console.log('Gift request created successfully:', data);
    },
    onError: (error: Error) => {
      console.error('Error creating gift request:', error);
    },
  });
};