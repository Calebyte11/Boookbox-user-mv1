import { useCartStore } from "@/store/cartStore";
import { ChevronLeft } from "lucide-react";
import Quantity from "../components/sponsor/Quantity";
import {
  useNavigate,
  Link,
  useSearchParams,
  useParams,
} from "react-router-dom";
import OrderForm from "@/components/sponsor/OrderForm";
import type { OrderFormValues } from "../features/sponsor/types";
import Button from "@/components/Button";
import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
import { useBookingDetailQuery } from "@/hooks/useUserQueries";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { GiftRequestDataAuth } from "@/services/giftRequestService"; // Add this import

const OrderPage = () => {
  const { items, removeItem, getCurrentRestaurantId } = useCartStore(
    (state) => state
  );
  const dateNow = new Date().toLocaleDateString();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { businessId: urlBusinessId } = useParams<{ businessId: string }>();
  
  // NEW: Check if this is a campaign order
  const [campaignOrderData, setCampaignOrderData] = useState<{
    campaignId: string;
    minOrder: number;
    maxOrder?: number;
  } | null>(null);
  const isCampaignOrder = !!campaignOrderData;
  
  // NEW: Check if this is a gift request
  const giftRequestId = searchParams.get("giftRequest");
  const isGiftRequest = !!giftRequestId;
  const [giftRequestData, setGiftRequestData] = useState<GiftRequestDataAuth | null>(null);
  
  // Check if we're in edit mode
  const editBookingId = searchParams.get("editBooking");
  const isEditMode = !!editBookingId;

  // Get current restaurant ID from cart or URL (for edit mode)
  const cartRestaurantId = getCurrentRestaurantId();
  const currentRestaurantId = isEditMode ? urlBusinessId : cartRestaurantId;

  // NEW: Load campaign order data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem("campaignOrderData");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setCampaignOrderData(parsedData);
      } catch (error) {
        console.error("Failed to parse campaign order data:", error);
      }
    }
  }, []);

  // NEW: Load gift request data from sessionStorage
  useEffect(() => {
    if (isGiftRequest) {
      const storedData = sessionStorage.getItem("giftRequestData");
      if (storedData) {
        try {
          const parsedData: GiftRequestDataAuth = JSON.parse(storedData);
          setGiftRequestData(parsedData);
        } catch (error) {
          console.error("Failed to parse gift request data:", error);
        }
      }
    }
  }, [isGiftRequest]);

  // Fetch existing booking data when in edit mode to check loading state
  const { isLoading: isLoadingBooking, error: bookingError } =
    useBookingDetailQuery(editBookingId || "", {
      enabled: isEditMode && !!editBookingId,
    });

  // Fetch restaurant data using the authenticated API
  const {
    data: restaurantData,
    isLoading,
    // error,
    // isError,
  } = useRestaurantDetailQuery(currentRestaurantId || "", {
    enabled: !!currentRestaurantId,
  });

  const restaurantInfo = {
    id: currentRestaurantId || "",
    name: restaurantData?.name || giftRequestData?.business.name || "Unknown Store",
    address: restaurantData?.address || "Address not available",
  };

  const handleSubmit = (data: OrderFormValues) => {
    if (data) {
      console.log("Order form pending creation");
    }
  };
  
  const handleDelete = (itemId: string) => {
    removeItem(itemId);
    
    // NEW: Clear campaign order data if cart becomes empty
    if (items.length === 1 && isCampaignOrder) {
      sessionStorage.removeItem("campaignOrderData");
    }
    
    // NEW: Clear gift request data if cart becomes empty
    if (items.length === 1 && isGiftRequest) {
      sessionStorage.removeItem("giftRequestData");
    }
  };
  
  // Calculate totals
  const orderSummary = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return { totalItems, totalPrice };
  }, [items]);
  
  // Handle case where cart becomes empty (e.g., quantity reduced to 0)
  useEffect(() => {
    if (!currentRestaurantId || (items.length === 0 && !isEditMode)) {
      // Small delay to allow for any pending state updates
      const timeout = setTimeout(() => {
        navigate(-1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [items.length, currentRestaurantId, navigate, isEditMode]);
  
  if (!currentRestaurantId || (items.length === 0 && !isEditMode)) {
    return (
      <section className="py-6 relative font-roboto flex flex-col items-center justify-center h-screen">
        <p className="text-xl text-gray-500">Your cart is empty.</p>
        <Button
          onClick={() => navigate(-1)}
          className="mt-4 bg-primary text-white p-2"
        >
          <span>Go to Shopping</span>
        </Button>
      </section>
    );
  }

  // Show error state if booking not found in edit mode
  if (isEditMode && bookingError) {
    return (
      <section className="py-6 relative font-roboto flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">Booking Not Found</p>
          <p className="text-gray-600 mb-6">
            The booking you're trying to edit could not be found. It may have
            been deleted or you may not have permission to edit it.
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="bg-primary text-white p-2"
          >
            Go Back
          </Button>
        </div>
      </section>
    );
  }

  // Show loading state in edit mode when cart is empty or booking is loading
  if (isEditMode && (items.length === 0 || isLoadingBooking)) {
    return <LoadingSpinner />;
  }

  return (
    <section className="py-6 relative font-roboto">
      <div className="p-2 mx-auto flex">
        <ChevronLeft
          className="w-[24px] ml-2 text-black cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <div className="flex flex-col justify-center text-center w-full">
          <h1 className="text-gray-400 text-sm">Your Order</h1>
          <p className="text-black">Available {dateNow.toLocaleString()}</p>
        </div>
      </div>
      
      <div className="border border-gray-300 flex flex-col gap-3" />
      
      {/* Restaurant details */}
      <div className="flex p-4 items-center justify-between">
        <div className="flex gap-2 items-center">
          <h1 className="text-black text-2xl capitalize">
            {isLoading ? "Loading..." : restaurantInfo.name}
          </h1>
          <p className="text-black text-xs">
            {isLoading ? "Loading..." : restaurantInfo.address}
          </p>
        </div>
        <Link
          to={`/restaurants/${restaurantInfo.id}/`}
          className="text-primary text-full text-sm"
        >
          Add new
        </Link>
      </div>
      
      {/* Display all cart items */}
      {items.map((item, index) => (
        <div key={item.id}>
          <div className="flex px-4 pt-2 items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="capitalize">{item.mealName}</h1>
                {item.appliedPricingTier && item.appliedPricingTier !== 'unit' && (
                  <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                    {item.appliedPricingTier.charAt(0).toUpperCase() + item.appliedPricingTier.slice(1)} Rate
                  </span>
                )}
              </div>
              {item.userInstruction && (
                <p className="text-gray-600 text-sm">{item.userInstruction}</p>
              )}
              <p className="py-2">{formatCurrency(item.totalPrice)}</p>
            </div>

            <Quantity
              quantity={item.quantity}
              deleteIcon={true}
              itemId={item.id}
              onDelete={() => handleDelete(item.id)}
              minimumCampaignOrder={campaignOrderData?.minOrder}
            />
          </div>
          {index < items.length - 1 && (
            <div className="border-t border-gray-200 mx-4" />
          )}
        </div>
      ))}
      
      {/* Order Summary */}
      <div className="mx-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Items:</span>
          <span className="font-medium">{orderSummary.totalItems}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-600">Total Amount:</span>
          <span className="font-bold text-lg">
            {formatCurrency(orderSummary.totalPrice)}
          </span>
        </div>
      </div>
      
      <div className="border-t border-gray-300 py-3" />
      
      {/* Order details - NEW: Pass gift request and campaign data */}
      <OrderForm 
        onSubmit={handleSubmit} 
        restaurantId={restaurantInfo.id}
        giftRequestData={giftRequestData}
        campaignOrderData={campaignOrderData}
      />
    </section>
  );
};

export default OrderPage;