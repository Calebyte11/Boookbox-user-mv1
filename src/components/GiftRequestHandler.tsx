import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, ShoppingCart } from "lucide-react";
import useAuthStore from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { 
  giftRequestService, 
  type GiftRequestDataPublic,
  type GiftRequestDataAuth 
} from "@/services/giftRequestService";
import { useToast } from "@/hooks/useToast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatCurrency } from "@/utils/formatCurrency";

const GiftRequestHandler: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, clearCart } = useCartStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [giftRequest, setGiftRequest] = useState<GiftRequestDataPublic | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFulfilling, setIsFulfilling] = useState(false);

  useEffect(() => {
    const fetchGiftRequest = async () => {
      console.group("🎁 Gift Request Fetch - Started");
      console.log("Request ID:", requestId);
      console.log("Is Authenticated:", isAuthenticated);
      console.log("Timestamp:", new Date().toISOString());
      
      if (!requestId) {
        console.error("❌ No request ID provided");
        console.groupEnd();
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
        console.log("📡 Fetching public gift request data...");
        
        // Fetch public gift request data (works for both authenticated and unauthenticated users)
        const response = await giftRequestService.getGiftRequestByIdPublic(requestId);
        
        console.log("📦 Response received:", response);
        console.log("Response structure:", {
          hasResponse: !!response,
          hasSuccess: response?.success,
          hasData: !!response?.data,
          dataKeys: response?.data ? Object.keys(response.data) : []
        });
        
        if (!response || !response.success || !response.data) {
          console.error("❌ Invalid response structure:", {
            response,
            hasResponse: !!response,
            hasSuccess: response?.success,
            hasData: !!response?.data
          });
          throw new Error("Failed to fetch gift request");
        }

        const requestData = response.data;
        console.log("✅ Gift request data:", {
          id: requestData._id,
          productName: requestData.product?.name,
          businessName: requestData.business?.name,
          quantity: requestData.quantity,
          totalAmount: requestData.totalAmount,
          currency: requestData.currency,
          createdAt: requestData.createdAt
        });
        console.log("ℹ️ Note: 'status' and 'user' fields not available in public endpoint");

        // Note: Public endpoint doesn't include status field
        // Status validation will occur during fulfillment (authenticated call)
        console.log("✅ Setting gift request state");
        setGiftRequest(requestData);
        setQuantity(requestData.quantity);
        console.log("✅ Gift request fetch completed successfully");
        console.groupEnd();
        
      } catch (err) {
        console.error("❌ Error fetching gift request:");
        console.error("Error type:", err?.constructor?.name);
        console.error("Error message:", err instanceof Error ? err.message : "Unknown error");
        console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
        console.error("Full error object:", err);
        console.groupEnd();
        
        setError(err instanceof Error ? err.message : "An error occurred");
        
        toast({
          title: "Error",
          description: "Failed to load gift request. Please try again.",
          variant: "error",
        });
        
        setTimeout(() => navigate("/home"), 2000);
      } finally {
        setIsLoading(false);
        console.log("🏁 Gift request fetch process completed");
      }
    };

    fetchGiftRequest();
  }, [requestId, navigate, toast, isAuthenticated]);

  const handleFulfillRequest = async () => {
    console.group("🎯 Fulfill Gift Request - Started");
    console.log("Gift Request ID:", requestId);
    console.log("Current Quantity:", quantity);
    console.log("Is Authenticated:", isAuthenticated);
    console.log("Timestamp:", new Date().toISOString());
    
    if (!giftRequest) {
      console.error("❌ No gift request data available");
      console.groupEnd();
      return;
    }

    console.log("Gift Request Summary:", {
      id: giftRequest._id,
      productId: giftRequest.product._id,
      productName: giftRequest.product.name,
      businessId: giftRequest.business._id,
      businessName: giftRequest.business.name,
      quantity: quantity,
      pricePerUnit: giftRequest.product.price,
      totalAmount: giftRequest.product.price * quantity
    });

    // Check authentication
    if (!isAuthenticated) {
      console.log("⚠️ User not authenticated - redirecting to login");
      const encodedTarget = encodeURIComponent(`${window.location.origin}/gifting/requests/r/${requestId}`);
      const signinUrl = `/auth/login?next=${encodedTarget}`;
      
      console.log("Redirect URL:", signinUrl);
      console.log("Target after login:", encodedTarget);
      console.groupEnd();
      
      toast({
        title: "Authentication Required",
        description: "Please sign in or create an account to fulfill this gift request.",
        variant: "info",
        duration: 3000,
      });
      
      navigate(signinUrl, { replace: true });
      return;
    }

    try {
      setIsFulfilling(true);
      console.log("📡 Fetching full gift request with authentication...");

      // Fetch full gift request with authentication to get user details AND status
      const fullResponse = await giftRequestService.getGiftRequestById(requestId!);
      
      console.log("📦 Full response received:", fullResponse);
      console.log("Full response structure:", {
        hasResponse: !!fullResponse,
        hasSuccess: fullResponse?.success,
        hasData: !!fullResponse?.data,
        hasUserData: !!fullResponse?.data?.user,
        hasStatus: !!fullResponse?.data?.status,
        status: fullResponse?.data?.status,
        dataKeys: fullResponse?.data ? Object.keys(fullResponse.data) : []
      });
      
      const fullGiftRequest: GiftRequestDataAuth = fullResponse.data;
      
      console.log("✅ Full gift request data:", {
        id: fullGiftRequest._id,
        status: fullGiftRequest.status,
        userName: fullGiftRequest.user?.fullName,
        userEmail: fullGiftRequest.user?.email,
        productName: fullGiftRequest.product.name,
        businessName: fullGiftRequest.business.name
      });

      // NOW validate the status (we have it from the authenticated endpoint)
      if (fullGiftRequest.status !== "open") {
        console.warn("⚠️ Gift request is not OPEN:", fullGiftRequest.status);
        console.groupEnd();
        
        toast({
          title: "Request Unavailable",
          description: `This gift request is ${fullGiftRequest.status} and cannot be fulfilled.`,
          variant: "error",
        });
        
        setIsFulfilling(false);
        // Navigate back home after showing error
        setTimeout(() => navigate("/home"), 2000);
        return;
      }

      console.log("✅ Status validation passed - gift request is pending");
      console.log("🛒 Clearing cart...");
      clearCart();
      console.log("✅ Cart cleared");
      
      const cartItem = {
        mealId: fullGiftRequest.product._id,
        mealName: fullGiftRequest.product.name,
        mealImage: fullGiftRequest.product.images?.[0] || fullGiftRequest.business.profileImage,
        quantity: quantity,
        price: fullGiftRequest.product.price * quantity,
        pricePerUnit: fullGiftRequest.product.price,
        restaurantId: fullGiftRequest.business._id,
        restaurantName: fullGiftRequest.business.name,
        choices: {},
        userInstruction: `Gift request from ${fullGiftRequest.user.fullName}`,
      };

      console.log("📝 Cart item to add:", cartItem);
      console.log("🛒 Adding item to cart...");
      addItem(cartItem);
      console.log("✅ Item added to cart");

      // Store gift request data
      console.log("💾 Storing gift request data in sessionStorage...");
      sessionStorage.setItem("giftRequestData", JSON.stringify(fullGiftRequest));
      console.log("✅ Data stored in sessionStorage");

      toast({
        title: "Gift Request Loaded",
        description: `You're now fulfilling ${fullGiftRequest.user.fullName}'s request.`,
        variant: "success",
      });

      // Navigate to order page
      const businessCategory = fullGiftRequest.business.category.toLowerCase();
      const orderUrl = businessCategory === "restaurant"
        ? `/restaurants/${fullGiftRequest.business._id}/orders?giftRequest=${requestId}`
        : `/${businessCategory}/${fullGiftRequest.business._id}/orders?giftRequest=${requestId}`;
      
      console.log("🚀 Navigating to order page:", orderUrl);
      console.log("✅ Fulfill process completed successfully");
      console.groupEnd();
      
      navigate(orderUrl, { replace: true });
    } catch (err) {
      console.error("❌ Error fulfilling gift request:");
      console.error("Error type:", err?.constructor?.name);
      console.error("Error message:", err instanceof Error ? err.message : "Unknown error");
      console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
      console.error("Full error object:", err);
      console.groupEnd();
      
      toast({
        title: "Error",
        description: "Failed to process gift request. Please try again.",
        variant: "error",
      });
    } finally {
      setIsFulfilling(false);
      console.log("🏁 Fulfill process completed");
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, quantity + delta);
    console.log("📊 Quantity changed:", {
      previousQuantity: quantity,
      delta: delta,
      newQuantity: newQuantity,
      totalAmount: giftRequest ? giftRequest.product.price * newQuantity : 0
    });
    setQuantity(newQuantity);
  };

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
  if (error || !giftRequest) {
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
          <p className="text-gray-600 mb-6">{error || "Something went wrong"}</p>
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

  const totalAmount = giftRequest.product.price * quantity;

  // Gift Request Preview
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-2 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{`Gift Request for ${
            giftRequest.user.accountType === "organization"
              ? giftRequest.user.organizationName
              : giftRequest.user.fullName
          }`}</h1>
        </div>
      </div>



      {/* =========== The Recipient/Requester Info ========== */}
      {/* <div>

      
        <div className="relative w-full aspect-[4/3] bg-gray-900">
          <img
            src={giftRequest.product.images?.[0] || giftRequest.business.profileImage}
            alt={giftRequest.product.name}
            className="w-full h-full object-cover"
          />

        </div>
      </div> */}
      <div className="max-w-2xl mx-auto">
        {/* Product Image */}
        <div className="relative w-full aspect-[4/3] bg-gray-900">
          <img
            src={giftRequest.product.images?.[0] || giftRequest.business.profileImage}
            alt={giftRequest.product.name}
            className="w-full h-full object-cover"
          />
          
          {/* Gift Badge Overlay */}
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
            <Heart className="w-4 h-4 fill-current" />
            <span className="text-sm font-semibold">Gift Request</span>
          </div>
        </div>

        {/* Product Details Card */}
        <div className="bg-white">
          <div className="px-4 py-6">
            {/* Category Badge */}
            <div className="mb-3">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full uppercase">
                {giftRequest.product.category}
              </span>
            </div>

            {/* Product Name */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {giftRequest.product.name}
            </h2>

            {/* Description */}
            {giftRequest.product.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {giftRequest.product.description}
              </p>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  <span className="text-xl text-gray-600">−</span>
                </button>
                <span className="text-lg font-semibold text-gray-900 min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl text-gray-600">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Card */}
        <div className="bg-white mt-2 px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <img
              src={giftRequest.business.profileImage}
              alt={giftRequest.business.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{giftRequest.business.name}</h3>
              <p className="text-sm text-gray-500 capitalize">{giftRequest.business.category}</p>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Items:</span>
              <span className="font-semibold text-gray-900">{quantity}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(totalAmount, giftRequest.business.paymentCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white mt-2 px-4 py-6 sticky bottom-0 border-t border-gray-200">
          <button
            onClick={handleFulfillRequest}
            disabled={isFulfilling}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
          >
            {isFulfilling ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                Fulfill Gift Request
              </>
            )}
          </button>
          
          {!isAuthenticated && (
            <p className="text-center text-sm text-gray-500 mt-3">
              Sign in required to fulfill this request
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftRequestHandler;