import { useMutation } from '@tanstack/react-query';

// Define the request payload interface
interface CreateGiftRequestPayload {
  packageId: string;
  businessId: string;
  quantity: number;
  totalPrice: number;
  customMessage: string;
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
//   const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http:localhost:5000';

// ===== FOR DEVELOPMENT =====
    const baseUrl = "https://boookbox-backend-cpvu.onrender.com";
  
  const response = await fetch(`${baseUrl}/u/request/gift/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies/auth tokens
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