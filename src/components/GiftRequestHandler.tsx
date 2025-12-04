import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { giftRequestService, type GiftRequestData } from "@/services/giftRequestService";
import { useToast } from "@/hooks/useToast";
import LoadingSpinner from "@/components/LoadingSpinner";

const GiftRequestHandler: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, clearCart } = useCartStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userAppUrl = import.meta.env.VITE_USER_APP_URL;

  useEffect(() => {
    const handleGiftRequest = async () => {
      // Step 1: Check authentication
      if (!isAuthenticated) {
        // Store the current URL as the target destination

        const encodedTarget = encodeURIComponent(`${userAppUrl}/gifting/requests/r/${requestId}`);
        
        // Redirect to sign in with target parameter
        const signinUrl = `/auth/login?next=${encodedTarget}`;
        
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to view this gift request.",
          variant: "info",
          duration: 3000,
        });
        
        navigate(signinUrl, { replace: true });
        return;
      }

      // Step 2: Validate requestId
      if (!requestId) {
        setError("Invalid gift request link");
        toast({
          title: "Invalid Link",
          description: "The gift request link is invalid or malformed.",
          variant: "error",
        });
        navigate("/home");
        return;
      }

      try {
        setIsLoading(true);
        
        // Step 3: Fetch gift request data
        console.log("Fetching gift request for ID:", requestId);
        const response = await giftRequestService.getGiftRequestById(requestId);
        
        console.log("Gift request response:", response);
        
        if (!response) {
          throw new Error("No response received from server");
        }
        
        if (!response.success) {
          throw new Error("Failed to fetch gift request: Server returned unsuccessful response");
        }
        
        if (!response.data) {
          throw new Error("Failed to fetch gift request: No data in response");
        }

        const giftRequest: GiftRequestData = response.data;

        // Step 4: Validate gift request status
        if (giftRequest.status !== "pending") {
          toast({
            title: "Request Unavailable",
            description: `This gift request is ${giftRequest.status} and cannot be fulfilled.`,
            variant: "error",
          });
          navigate("/home");
          return;
        }

        // Step 5: Clear existing cart and add the requested product
        clearCart();
        
        const cartItem = {
          mealId: giftRequest.product._id,
          mealName: giftRequest.product.name,
          mealImage: giftRequest.product.image || giftRequest.business.profileImage,
          quantity: giftRequest.quantity,
          price: giftRequest.totalAmount,
          pricePerUnit: giftRequest.product.price,
          restaurantId: giftRequest.business._id,
          restaurantName: giftRequest.business.name,
          choices: {},
          userInstruction: `Gift request from ${giftRequest.user.fullName}`,
        };

        addItem(cartItem);

        // Step 6: Store gift request data in sessionStorage for OrderForm to use
        sessionStorage.setItem("giftRequestData", JSON.stringify(giftRequest));

        toast({
          title: "Gift Request Loaded",
          description: `You're now fulfilling ${giftRequest.user.fullName}'s request.`,
          variant: "success",
        });

        // Step 7: Navigate to order page with gift request flag
        const businessCategory = giftRequest.business.category.toLowerCase();
        navigate(
          businessCategory === "restaurant"
            ? `/restaurants/${giftRequest.business._id}/orders?giftRequest=${requestId}`
            : `/${businessCategory}/${giftRequest.business._id}/orders?giftRequest=${requestId}`,
          { replace: true }
        );
      } catch (err) {
        console.error("Error handling gift request:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        
        toast({
          title: "Error",
          description: "Failed to load gift request. Please try again.",
          variant: "error",
        });
        
        // Navigate to home after a short delay
        setTimeout(() => navigate("/home"), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    handleGiftRequest();
  }, [requestId, isAuthenticated, navigate, toast, addItem, clearCart]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Loading gift request...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Gift Request
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GiftRequestHandler;