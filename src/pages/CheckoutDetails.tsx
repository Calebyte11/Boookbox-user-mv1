/* eslint-disable @typescript-eslint/no-explicit-any */
import CartButton from "@/components/CartButton";
import HeaderNav from "../components/sponsor/HeaderNav";
import {
  useCartStore,
} from "@/store/cartStore";
import { useBookingStore } from "@/store/bookingStore";
import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
import {
  useBookingDetailQuery,
  useCreateBooking,
} from "@/hooks/useUserQueries";
import type { BookingCreateBody } from "@/services/usersService";
import type { MenuItem } from "@/types/ticket";
import type { BookingDetail } from "@/types/ticket";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  calculatePaymentBreakdown,
  getDefaultTaxAmount,
  getDefaultServiceFeePercent,
  // getVatPercent,
  // debugPaymentConstants,
} from "@/utils/calculateTotalPayment";
import { useToast } from "@/hooks/useToast";
import {
  useHostedPaymentGateway,
} from "@/hooks/useHostedPaymentGateway";
import { PaymentAuthorizationModal } from "@/components/PaymentAuthorizationModal";
import { useReceiptStore } from "@/store/receiptStore";
import { ExistingBookingPricing } from "@/components/checkout/ExistingBookingPricing";
import { NewBookingPricing } from "@/components/checkout/NewBookingPricing";
import type { PricingResult } from "@/components/checkout/types";
// import Button from "@/components/Button";

const CheckoutDetails = () => {
  const { items } = useCartStore((state) => state);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlBookingId = searchParams.get("bookingId");
  const [paymentInitializing, setPaymentInitializing] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  // New: Show payment success modal/message
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const {
    recipientDetails,
    deliveryDate,
    deliveryTime,
    bookingId: storeBookingId,
    bookingType,
    numberOfRecipients,
    restaurantId: storedRestaurantId,
    restaurantName,
    specialInstructions,
    bookingPayload,
    calculatedTotalAmount,
    updateBookingDetails,
  } = useBookingStore((state) => state);
  const navigate = useNavigate();
  const setReceipt = useReceiptStore((state) => state.setReceipt);
  // Generate consistent session storage key - memoized to avoid dependency issues
  const getSessionStorageKey = useCallback(() => {
    try {
      if (!bookingPayload) return null;

      // Create a more reliable hash from booking payload - avoid circular deps
      const keyData = {
        restaurantId: bookingPayload.restaurantId,
        reason: bookingPayload.reason,
        deliveryDate: bookingPayload.deliveryDate,
        itemCount: items.length,
        timestamp: Date.now(), // Add timestamp to make each session unique
      };

      const keyString = JSON.stringify(keyData);
      return `booking_${btoa(keyString)
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 32)}`;
    } catch (error) {
      console.error("Error generating session storage key:", error);
      return null;
    }
  }, [bookingPayload, items.length]);

  // Get session booking ID helper function
  const getSessionBookingId = useCallback(() => {
    try {
      const sessionKey = getSessionStorageKey();
      return sessionKey ? sessionStorage.getItem(sessionKey) : null;
    } catch (error) {
      console.error("Error getting session booking ID:", error);
      return null;
    }
  }, [getSessionStorageKey]);

  // Determine current booking ID: URL > Session Storage > Store (for backward compatibility)
  const bookingId = urlBookingId || getSessionBookingId() || storeBookingId;

  // Fetch booking details if bookingId exists
  const { data: bookingData, isLoading: loadingBooking } =
    useBookingDetailQuery(bookingId || "", { enabled: !!bookingId });

  // Determine restaurant ID
  let restaurantId = storedRestaurantId || items[0]?.restaurantId; // Extract booking data with new API structure support
  if (urlBookingId && bookingData) {
    const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
    restaurantId =
      restaurantId ||
      booking?.restaurantId ||
      booking?.bookedAtRestaurant?.restaurantId;
  }

  // Fetch restaurant details
  const { data: restaurant, isLoading: loadingRestaurant } =
    useRestaurantDetailQuery(restaurantId, { enabled: !!restaurantId });
    
  // Pricing state - will be populated by pricing components
  const [pricingResult, setPricingResult] = useState<PricingResult>({
    subtotal: 0,
    deliveryFee: 0,
    serviceFee: 0,
    tax: 0,
  });

  // Constants for calculations
  const defaultServiceFeePercent = getDefaultServiceFeePercent();
  const defaultTaxAmount = getDefaultTaxAmount();
  // const vatPercent = getVatPercent();

  // Extract values for easier access
  const { subtotal, deliveryFee, serviceFee, tax } = pricingResult;

  const computedBreakdown = useMemo(
    () => {
      return calculatePaymentBreakdown(subtotal, deliveryFee, tax, serviceFee, {
        serviceFeePercent: defaultServiceFeePercent,
      });
    },
    [
      subtotal,
      deliveryFee,
      tax,
      serviceFee,
      defaultServiceFeePercent,
    ]
  );

  const totalDisplayAmount = computedBreakdown.totalPayable;
  const totalInSmallestUnit = computedBreakdown.totalPayableInSmallestUnit;

  // Use stored calculated total if available (from OrderForm) - it's the source of truth
  // This overrides the computed breakdown because OrderForm has the exact calculation logic
  const hasValidStoredAmount = calculatedTotalAmount && calculatedTotalAmount > 0;
  
  const totalAmountValue = hasValidStoredAmount
    ? calculatedTotalAmount
    : typeof totalInSmallestUnit === "number" && totalInSmallestUnit > 0
    ? totalInSmallestUnit / 100
    : totalDisplayAmount;
  
  const normalizedTotalAmount = Number(totalAmountValue.toFixed(2));
  
  // When using stored calculated total, display it directly
  // Otherwise use the computed breakdown display amount
  const displayTotalAmount = hasValidStoredAmount 
    ? normalizedTotalAmount 
    : totalDisplayAmount;
  // Get restaurant currency from various sources
  const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
  const restaurantFromBooking = booking?.bookedAtRestaurant;
  // Prefer embedded restaurant data over separate query result
  const restaurantCurrency =
    restaurantFromBooking?.paymentCurrency || booking?.paymentCurrency || "NGN";

  const { toast } = useToast();
  const handleHostedPaymentFailure = useCallback(
    (payload: { bookingId?: string; paymentReference?: string; reason: string }) => {
      toast({
        title: "Payment initialization failed",
        description: payload.reason,
        variant: "error",
      });
    },
    [toast]
  );

  const {
    status: hostedPaymentStatus,
    error: hostedPaymentError,
    authorizationUrl,
    isModalOpen,
    paymentReference: currentPaymentReference,
    latestVerification,
    startPayment: startHostedPayment,
    verifyPayment: verifyHostedPayment,
    closeModal: closeHostedPaymentModal,
    reset: resetHostedPayment,
    openAuthorizationInNewTab,
    isVerifying: isHostedPaymentVerifying,
    handlePaymentSuccess,
  } = useHostedPaymentGateway({
    provider: "paystack",
    paymentType: "split",
    serviceFee,
    tax,
    autoVerify: false, // Disabled since we use iframe message interception
    pollIntervalMs: 5000,
    maxPollAttempts: 12,
    onFailure: handleHostedPaymentFailure,
  });

  useEffect(() => {
    if (
      hostedPaymentStatus === "initializing" ||
      hostedPaymentStatus === "awaiting_authorization" ||
      hostedPaymentStatus === "authorizing" ||
      hostedPaymentStatus === "verifying"
    ) {
      setPaymentInitializing(true);
    } else if (
      hostedPaymentStatus === "failed" ||
      hostedPaymentStatus === "success" ||
      hostedPaymentStatus === "idle" ||
      hostedPaymentStatus === "cancelled"
    ) {
      setPaymentInitializing(false);
    }
  }, [hostedPaymentStatus]);

  // Debug: Log when using stored calculated total amount
  useEffect(() => {
    // Check localStorage for booking data
    const bookingStorage = localStorage.getItem("booking-storage");
    const parsedStorage = bookingStorage ? JSON.parse(bookingStorage) : null;
    
    console.log("🔍 Checkout Debug Info:", {
      calculatedTotalAmount,
      normalizedTotalAmount,
      bookingType,
      numberOfRecipients,
      subtotal,
      totalDisplayAmount,
      hasStoredAmount: !!calculatedTotalAmount && calculatedTotalAmount > 0,
    });
    
    console.log("📦 LocalStorage booking-storage:", parsedStorage);
    
    if (calculatedTotalAmount && calculatedTotalAmount > 0) {
      console.log("✅ Using stored calculated total from OrderForm:", {
        calculatedTotalAmount,
        normalizedTotalAmount,
        bookingType,
        numberOfRecipients,
      });
    } else {
      console.log("⚠️ No stored calculated total found, using computed breakdown");
      console.log("📊 Fallback calculation using:", {
        subtotal,
        totalDisplayAmount,
        totalInSmallestUnit,
      });
    }
  }, [calculatedTotalAmount, normalizedTotalAmount, bookingType, numberOfRecipients, subtotal, totalDisplayAmount, totalInSmallestUnit]);

  const createBookingMutation = useCreateBooking();
  const isLoading = loadingRestaurant || loadingBooking;

  // Function to clear all booking data after successful payment
  const clearBookingData = useCallback(() => {
    try {
      // console.log("🧹 Clearing booking data after successful payment...");

      // Clear from session storage
      const sessionKey = getSessionStorageKey();
      if (sessionKey) {
        sessionStorage.removeItem(sessionKey);
      }

      // Clear from booking store
      updateBookingDetails({
        bookingId: undefined,
        recipientDetails: undefined,
        deliveryDate: undefined,
        specialInstructions: undefined,
        numberOfRecipients: 1,
        bookingType: undefined,
        bookingPayload: undefined,
        calculatedTotalAmount: undefined,
      });

      // Clear cart
      useCartStore.getState().clearCart();

      // console.log("Booking data cleared successfully");
    } catch (error) {
      console.error("Error clearing booking data:", error);
    }
  }, [getSessionStorageKey, updateBookingDetails]);
  // Clean up session storage when component unmounts
  useEffect(() => {
    return () => {
      try {
        const sessionKey = getSessionStorageKey();
        const sessionBookingId = getSessionBookingId();
        if (sessionKey && sessionBookingId) {
          // Clean up immediately if we're navigating away
          // This prevents stale booking IDs from being reused
          sessionStorage.removeItem(sessionKey);
        }
      } catch (error) {
        console.error("Error cleaning up session storage:", error);
      }
    };
  }, [getSessionStorageKey, getSessionBookingId]);

  // Sync URL booking ID with store (for existing bookings)
  useEffect(() => {
    if (urlBookingId && urlBookingId !== storeBookingId) {
      
      updateBookingDetails({ bookingId: urlBookingId });
    }
  }, [urlBookingId, storeBookingId, updateBookingDetails]); // Check for existing booking in session storage (for new bookings in progress)
  useEffect(() => {
    // Skip if we already have a URL booking (existing booking scenario)
    if (urlBookingId) return;

    try {
      const sessionKey = getSessionStorageKey();
      if (!sessionKey) return;

      const existingBookingId = sessionStorage.getItem(sessionKey);
      if (existingBookingId) {
        // console.log("📦 Found booking in session storage:", existingBookingId);
        updateBookingDetails({ bookingId: existingBookingId });

        // Update URL to include the booking ID
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set("bookingId", existingBookingId);
        setSearchParams(newSearchParams, { replace: true });
      }
    } catch (error) {
      console.error("Error checking session storage:", error);
    }
  }, [
    urlBookingId,
    getSessionStorageKey,
    searchParams,
    setSearchParams,
    updateBookingDetails,
  ]);

  // Check if booking is already paid and show success UI if so
  useEffect(() => {
    if (urlBookingId && bookingData) {
      const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
      if (
        booking?.paymentStatus === "paid" ||
        booking?.status === "paid" ||
        booking?.isPaid
      ) {
        // Show payment success UI instead of redirecting immediately
        setShowPaymentSuccess(true);
      }
    }
  }, [urlBookingId, bookingData]);

  // Check for payment return parameters and handle accordingly
  useEffect(() => {
    const paymentType = searchParams.get("payment");
    const flutterwaveStatus = searchParams.get("status");
    const paystackReference = searchParams.get("reference");
    const trxref = searchParams.get("trxref");
    const reference = searchParams.get("reference");

    if (paymentType && (flutterwaveStatus || paystackReference)) {
      console.log(
        "🔄 Payment return detected, PaymentStateManager will handle this"
      );
      // The PaymentStateManager component will handle the payment return logic
      // We just need to ensure the component stays mounted and doesn't redirect prematurely
    }

    // Handle direct payment callback URLs (e.g., from verify-payment route redirect)
    if (trxref || reference) {
      console.log("🔄 Direct payment callback detected:", { trxref, reference });
      
      // Dispatch event to close payment modal and start verification
      window.dispatchEvent(
        new CustomEvent("closePaymentModal", {
          detail: {
            trxref,
            reference,
            status: flutterwaveStatus,
          },
        })
      );

      // Also dispatch paymentReturn event for any other listeners
      window.dispatchEvent(
        new CustomEvent("paymentReturn", {
          detail: {
            params: Object.fromEntries(searchParams.entries()),
            timestamp: Date.now(),
          },
        })
      );
    }
  }, [searchParams]);

  useEffect(() => {
    if (hostedPaymentStatus === "success" && latestVerification) {
      // Prevent infinite loops by checking if we've already handled this verification
      const verificationKey = `${latestVerification.paymentReference || latestVerification.transactionId}`;
      const handledKey = `payment_success_handled_${verificationKey}`;
      
      if (sessionStorage.getItem(handledKey)) {
        console.log("Payment success already handled for:", verificationKey);
        return;
      }
      
      // Mark as handled immediately
      sessionStorage.setItem(handledKey, 'true');
      
      // Set a timeout to clean up the flag after navigation
      setTimeout(() => {
        sessionStorage.removeItem(handledKey);
      }, 5000);
      
      // Handle payment success inline to avoid dependency issues
      const resolvedBookingId =
        latestVerification.bookingId ||
        urlBookingId ||
        getSessionBookingId() ||
        storeBookingId ||
        null;

      const transactionId =
        latestVerification.transactionId ||
        latestVerification.paymentReference ||
        currentPaymentReference ||
        `TX-${Date.now()}`;

      const paymentReference =
        latestVerification.paymentReference ||
        currentPaymentReference ||
        String(transactionId);

      setReceipt({
        transactionId,
        paymentReference,
        paymentDate: new Date().toISOString(),
        bookingDetails: {
          recipientDetails,
          deliveryDate: deliveryDate ?? null,
          deliveryTime: deliveryTime ?? null,
          specialInstructions: specialInstructions ?? null,
          totalAmount: normalizedTotalAmount,
          items: items.map((item) => ({
            id: item.id,
            mealId: item.mealId,
            mealName: item.mealName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
            userInstruction: item.userInstruction,
          })),
          itemCount: items.length,
          totalMeals: items.reduce((total, item) => total + item.quantity, 0),
          restaurantName: restaurantName || restaurant?.name || null,
          bookingType,
          numberOfRecipients,
        },
      });

      toast({
        title: "Payment confirmed",
        description: "Thanks for sponsoring this meal!",
        variant: "success",
      });

      clearBookingData();
      resetHostedPayment();

      if (resolvedBookingId) {
        navigate(`/payment-success?bookingId=${resolvedBookingId}`, {
          replace: true,
        });
      } else {
        navigate("/payment-success", { replace: true });
      }
    }
  }, [
    hostedPaymentStatus, 
    latestVerification, 
    urlBookingId, 
    storeBookingId, 
    currentPaymentReference,
    recipientDetails,
    deliveryDate,
    deliveryTime,
    specialInstructions,
    normalizedTotalAmount,
    items,
    restaurantName,
    restaurant?.name,
    bookingType,
    numberOfRecipients,
    setReceipt,
    toast,
    clearBookingData,
    resetHostedPayment,
    navigate,
    getSessionBookingId
  ]);

  // Handle empty cart
  if (items.length === 0 && !urlBookingId) {
    return (
      <section className="">
        <HeaderNav
          Heading="Review your gift order"
          HeadingClassName="!text-black text-xl"
        />
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 text-lg">Your cart is empty</p>
          <p className="text-gray-400 text-sm mt-2">
            Add some meals to proceed with checkout
          </p>
        </div>
      </section>
    );
  }

  // Redirect to success page if payment is confirmed
  if (showPaymentSuccess && urlBookingId && bookingData) {
    // Clear state before redirecting
    clearBookingData();
    navigate(`/payment-success?bookingId=${urlBookingId}`, { replace: true });
    return null;
  }
  // Show loading state
  if (isLoading && !restaurant) {
    return (
      <section className="">
        <HeaderNav
          Heading="Review your gift order"
          HeadingClassName="!text-black text-xl"
        />
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-gray-500 text-lg mt-4">Loading order details...</p>
        </div>
      </section>
    );
  } // Session-storage-first payment handler: check existing → create if needed → initialize payment
  const handlePayNow = async () => {
    if (
      isCreatingBooking ||
      paymentInitializing ||
      hostedPaymentStatus === "initializing" ||
      hostedPaymentStatus === "verifying" ||
      hostedPaymentStatus === "awaiting_authorization" ||
      hostedPaymentStatus === "authorizing"
    ) {
      return;
    }

    try {
      if (urlBookingId) {
        setPaymentInitializing(true);
        const paymentResult = await startHostedPayment({ bookingId: urlBookingId });
        if (!paymentResult.success) {
          throw new Error(paymentResult.error || "Failed to initialize payment");
        }
        return;
      }

      if (!bookingPayload) {
        throw new Error(
          "Missing booking information. Please go back and try again."
        );
      }

      const sessionKey = getSessionStorageKey();
      if (sessionKey) {
        sessionStorage.removeItem(sessionKey);
      }

      setIsCreatingBooking(true);
      toast({
        title: "Creating booking...",
        variant: "default",
        duration: 1000,
      });

      const { restaurantId: originalRestaurantId, menuItems, ...restOfPayload } = bookingPayload as any;

      // Transform menuItems to items with pid instead of menuId
      const transformedItems = menuItems?.map((item: any) => ({
        pid: item.menuId,  // Transform menuId to pid
        quantity: item.quantity,
        instructions: item.instructions,
      })) || [];

      const createBookingPayload = {
        ...restOfPayload,
        businessId: originalRestaurantId,
        items: transformedItems,
        totalAmount: normalizedTotalAmount,
        currency: "NGN",
        deliveryFee,
        createdAt: new Date().toISOString(),
        serviceFee,
        tax,
        paymentAmount: normalizedTotalAmount,
        paymentBreakdown: {
          mealPrice: subtotal,
          deliveryFee,
          serviceFee,
          tax,
          vat: computedBreakdown.vat,
          offset: computedBreakdown.offset,
          boookboxCharge: computedBreakdown.boookboxCharge,
          restaurantAmount: computedBreakdown.restaurantAmount,
          gatewayCharge: computedBreakdown.gatewayCharge,
          totalBeforeGateway: computedBreakdown.totalBeforeGateway,
          totalPayable: displayTotalAmount || totalDisplayAmount,
          totalPayableInSmallestUnit: computedBreakdown.totalPayableInSmallestUnit,
          transactionCharge: computedBreakdown.transactionCharge,
        },
      };
      console.log(createBookingPayload);
      

      const bookingResult = await createBookingMutation.mutateAsync(
        createBookingPayload as unknown as BookingCreateBody
      );

      const newBookingId = [
        bookingResult?.data?.bookingId,
        bookingResult?.bookingId,
        bookingResult?.data?._id,
        bookingResult?.data?.id,
        bookingResult?._id,
        bookingResult?.id,
      ].find((id) => typeof id === "string" && id.length > 0);

      if (!newBookingId) {
        throw new Error("Failed to create booking - no valid ID returned");
      }

      if (sessionKey) {
        try {
          sessionStorage.setItem(sessionKey, newBookingId);
        } catch (error) {
          console.error("Error storing booking in session storage:", error);
        }
      }

      updateBookingDetails({ bookingId: newBookingId });
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set("bookingId", newBookingId);
      setSearchParams(newSearchParams, { replace: true });

      toast({
        title: "Booking created successfully!",
        description: "Opening secure payment window...",
        variant: "success",
        duration: 1000,
      });

      setIsCreatingBooking(false);
      setPaymentInitializing(true);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const paymentResult = await startHostedPayment({ bookingId: newBookingId });
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Failed to initialize payment");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      if (errorMessage.includes("already been paid")) {
        navigate(`/bookings/${urlBookingId}`, { replace: true });
        setTimeout(() => {
          clearBookingData();
        }, 500);
        toast({
          title: "Booking Already Paid",
          description: "This booking has already been completed.",
          variant: "success",
          duration: 1000,
        });
        return;
      }

      toast({
        title: "Payment error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setPaymentInitializing(false);
      setIsCreatingBooking(false);
    }
  };

  // Rest of the render method remains the same
  return (
    <>
      {/* Pricing calculation components - these don't render anything but handle pricing logic */}
      {urlBookingId && bookingData ? (
        <ExistingBookingPricing
          bookingData={bookingData as BookingDetail[] | BookingDetail}
          onPricingCalculated={setPricingResult}
        />
      ) : (
        <NewBookingPricing
          cartItems={items}
          bookingType={bookingType}
          numberOfRecipients={numberOfRecipients}
          numberOfBookings={bookingPayload?.numberOfBookings as string | number | undefined}
          bookingData={bookingData as BookingDetail[] | BookingDetail | undefined}
          defaultServiceFeePercent={defaultServiceFeePercent}
          defaultTaxAmount={defaultTaxAmount}
          onPricingCalculated={setPricingResult}
        />
      )}
      
      <PaymentAuthorizationModal
        isOpen={isModalOpen && !!authorizationUrl}
        authorizationUrl={authorizationUrl}
        status={hostedPaymentStatus}
        error={hostedPaymentError}
        onClose={() => closeHostedPaymentModal()}
        onVerify={() => void verifyHostedPayment()}
        onOpenInNewTab={() => openAuthorizationInNewTab()}
        onPaymentSuccess={handlePaymentSuccess}
        isVerifying={isHostedPaymentVerifying}
      />
      <section className="">
      <HeaderNav
        Heading="Review your gift order"
        HeadingClassName="!text-black text-xl"
      />
      <div>
        <div className="flex p-4 items-center justify-between">
          <div className="">
            <h1 className="text-black text-2xl capitalize inline-flex gap-2 items-center">
              {(() => {
                if (urlBookingId && bookingData) {
                  const booking = bookingData;
                  return (
                    restaurant?.name ||
                    (typeof booking === "object" && "restaurantName" in booking
                      ? (booking as { restaurantName?: string }).restaurantName
                      : undefined) ||
                    "Loading..."
                  );
                }
                return (
                  restaurant?.name ||
                  restaurantName ||
                  items[0]?.restaurantName ||
                  "Loading..."
                );
              })()}
              <span className="text-black text-xs">
                {restaurant?.address ||
                  (typeof restaurant?.location === "string"
                    ? restaurant.location
                    : restaurant?.location &&
                      typeof restaurant?.location === "object"
                    ? `${restaurant.location.coordinates[1]}, ${restaurant.location.coordinates[0]}`
                    : "") ||
                  "ikeja Lagos"}
              </span>
            </h1>
            <p>
              {" "}
              {(() => {
                if (urlBookingId && bookingData) {
                  const booking = Array.isArray(bookingData)
                    ? bookingData[0]
                    : bookingData;
                  if (booking?.validityDate) {
                    const validityDate =
                      typeof booking.validityDate === "string"
                        ? booking.validityDate
                        : booking.validityDate?.stop ||
                          booking.validityDate?.start;
                    if (validityDate) {
                      return `Available until ${new Date(
                        validityDate
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}`;
                    }
                  }
                }

                return deliveryDate
                  ? `Available on ${new Date(deliveryDate).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}`
                  : bookingData &&
                    typeof bookingData === "object" &&
                    "validityDate" in bookingData &&
                    (bookingData as any).validityDate?.start
                  ? `Available on ${new Date(
                      (bookingData as any).validityDate.start
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}`
                  : "Available on the 23rd of May 2025";
              })()}
            </p>
          </div>
        </div>
        <div className="border-t border-gray-300 py-1" />{" "}
        <div className="flex p-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="flex flex-col">
              {(() => {
                if (urlBookingId && bookingData) {
                  const booking = Array.isArray(bookingData)
                    ? bookingData[0]
                    : bookingData;
                  const bookingType =
                    booking?.bookingType || booking?.bookedFor?.type;

                  if (bookingType === "public") {
                    return (
                      <>
                        <span className="text-sm">Public booking</span>
                        <span className="text-black/50 text-xs normal-case">
                          This is a public booking available for anyone to claim
                        </span>
                      </>
                    );
                  } else if (
                    bookingType === "self" ||
                    bookingType === "yourself"
                  ) {
                    return (
                      <>
                        <span className="text-sm">Personal booking</span>
                        <span className="text-black/50 text-xs normal-case">
                          This booking is for yourself
                        </span>
                      </>
                    );
                  } else if (
                    booking?.bookedFor?.contact &&
                    booking.bookedFor.contact.length > 0
                  ) {
                    const contact = booking.bookedFor.contact[0];
                    return (
                      <>
                        <span className="text-sm">
                          Recipient's contact details
                        </span>
                        <span className="text-black/50 text-xs">
                          {contact.name}
                        </span>
                        <span className="text-black/50 text-xs">
                          {contact.phoneNumber}
                        </span>
                        <span className="text-black/50 text-xs">
                          {contact.email}
                        </span>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <span className="text-sm">Gift booking</span>
                        <span className="text-black/50 text-xs normal-case">
                          Booked for{" "}
                          {booking?.bookedByName ||
                            booking?.bookedByUser?.fullName ||
                            "someone"}
                        </span>
                      </>
                    );
                  }
                }
                return recipientDetails ? (
                  <>
                    <span className="text-sm">Recipient's contact details</span>
                    <span className="text-black/50 text-xs">
                      {recipientDetails?.name}
                    </span>
                    <span className="text-black/50 text-xs">
                      {recipientDetails?.phone}
                    </span>
                    <span className="text-black/50 text-xs">
                      {recipientDetails?.email}
                    </span>
                  </>
                ) : bookingType === "public" ? (
                  <>
                    <span className="text-sm">Public booking</span>
                    <span className="text-black/50 text-xs normal-case">
                      This is a public booking available for anyone to claim
                    </span>
                  </>
                ) : bookingType === "yourself" ? (
                  <>
                    <span className="text-sm">Personal booking</span>
                    <span className="text-black/50 text-xs normal-case">
                      This booking is for yourself
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm">Gift booking</span>
                    <span className="text-black/50 text-xs normal-case">
                      No recipient details provided
                    </span>
                  </>
                );
              })()}
            </div>
          </div>
          {recipientDetails && bookingType !== "yourself" && !urlBookingId && (
            <button
              onClick={() => {
                // console.log("Edit recipient details clicked");
                navigate(-1);
              }}
              className="text-primary cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>
        {/* Booking Details Section */}
        {(() => {
          if (!bookingPayload || 
              !bookingPayload.bookedFor || 
              typeof bookingPayload.bookedFor !== 'object' || 
              !('type' in bookingPayload.bookedFor) ||
              (bookingPayload.bookedFor.type !== "contact" && bookingType === "yourself")) {
            return null;
          }
          
          return (
            <>
              <div className="border-t border-gray-300 py-1" />
              <div className="flex p-4 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <h1 className="text-black text-xl capitalize inline-flex flex-col gap-2">
                    Booking Information
                    <span className="text-black/50 text-xs normal-case">
                      {bookingPayload.bookingType === "public" 
                        ? "Public meal offering" 
                        : `Gift for ${
                            bookingPayload.bookedFor.type === "contact" && 
                            'contact' in bookingPayload.bookedFor && 
                            Array.isArray(bookingPayload.bookedFor.contact) && 
                            bookingPayload.bookedFor.contact.length > 1
                              ? `${bookingPayload.bookedFor.contact.length} recipients` 
                              : (bookingPayload.bookedFor.type === "contact" && 
                                 'contact' in bookingPayload.bookedFor && 
                                 Array.isArray(bookingPayload.bookedFor.contact) && 
                                 bookingPayload.bookedFor.contact[0]?.name) || "recipient"
                          }`
                      }
                    </span>
                  </h1>
                </div>
              </div>
            </>
          );
        })()}
        <div className="border-t border-gray-300 py-3 m-4" />
        {/* Order Items Section */}
        <div className="mx-4 mb-4">
          <h2 className="text-black text-xl font-semibold mb-3">
            Order Summary
          </h2>
          {urlBookingId && bookingData
            ? (() => {
                const booking = Array.isArray(bookingData)
                  ? bookingData[0]
                  : bookingData;
                return booking?.menuItems && booking.menuItems.length > 0 ? (
                  booking.menuItems.map((item: MenuItem, index: number) => {
                    // Handle both old and new API structure
                    const menuItem = item.menu || item;
                    const quantity = item.quantity || 1;
                    const price = menuItem.price || item.price || 0;
                    const currency =
                      menuItem.currency || item.currency || "NGN";
                    const name = menuItem.name || item.name || "Menu Item";

                    return (
                      <div
                        key={index}
                        className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-1">
                          <h3 className="text-black font-medium">{name}</h3>
                          <p className="text-gray-600 text-sm">
                            Qty: {quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-black font-medium">
                            {formatCurrency(price * quantity, currency)}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {formatCurrency(price, currency)} each
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <p className="text-black font-medium">
                      {booking?.reason || "Meal Package"}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Booking for {booking?.numberOfBookings || 1} meal(s)
                    </p>
                    <div className="text-right mt-2">
                      <p className="text-black font-medium">
                        {formatCurrency(
                          booking?.totalAmount || 0,
                          booking?.currency || "NGN"
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()
            : items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-start py-2 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <h3 className="text-black font-medium">{item.mealName}</h3>
                    <p className="text-gray-600 text-sm">
                      Qty: {item.quantity}
                    </p>
                    {Object.entries(item.choices).map(
                      ([choiceType, choiceValues]) =>
                        choiceValues && choiceValues.length > 0 ? (
                          <p key={choiceType} className="text-gray-500 text-xs">
                            {choiceType
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                            : {choiceValues.join(", ")}
                          </p>
                        ) : null
                    )}
                    {item.userInstruction && (
                      <p className="text-gray-500 text-xs">
                        Note: {item.userInstruction}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {" "}
                    <p className="text-black font-medium">
                      {formatCurrency(item.totalPrice, restaurantCurrency)}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {formatCurrency(item.pricePerUnit, restaurantCurrency)}
                    </p>
                  </div>
                </div>
              ))}
        </div>
        <div className="border-t border-gray-300 py-3 m-4" />
        <div className="flex flex-col mx-4 gap-2">
          <h3 className="text-black text-lg capitalize inline-flex gap-2 items-center justify-between">
            <span>
              Subtotal (
              {urlBookingId && bookingData
                ? (() => {
                    const booking = Array.isArray(bookingData)
                      ? bookingData[0]
                      : bookingData;
                    return (
                      booking?.menuItems?.reduce(
                        (total: number, item: MenuItem) => {
                          const quantity = item.quantity || 1;
                          return total + quantity;
                        },
                        0
                      ) ||
                      booking?.numberOfBookings ||
                      1
                    );
                  })()
                : items.reduce((total, item) => total + item.quantity, 0)}{" "}
              bookings
              {numberOfRecipients && numberOfRecipients > 1
                ? ` × ${numberOfRecipients} recipients`
                : ""}
              ):
            </span>
            <span>{formatCurrency(subtotal, restaurantCurrency)}</span>
          </h3>
          <h3 className="text-black text-md capitalize inline-flex gap-2 items-center justify-between">
            Delivery Fee:
            <span> {formatCurrency(deliveryFee, restaurantCurrency)}</span>
          </h3>
          <h3 className="text-black text-md capitalize inline-flex gap-2 items-center justify-between">
            Service Fee:
            <span> {formatCurrency(serviceFee, restaurantCurrency)}</span>
          </h3>
            <h3 className="text-black text-md capitalize inline-flex gap-2 items-center justify-between">
             Tax:
            <span>{formatCurrency(computedBreakdown.tax, restaurantCurrency)}</span>
            </h3>
            {/* <h3 className="text-black text-md capitalize inline-flex gap-2 items-center justify-between">
             Processing Fee:
            <span>{formatCurrency(computedBreakdown.gatewayCharge, restaurantCurrency)}</span>
            </h3> */}
            <p className="text-gray-500 text-xs mt-1">
            Note: Paystack processing fees apply and will be calculated at checkout.
            </p>
          {/* <h3 className="text-black text-md capitalize inline-flex gap-2 items-center justify-between">
            Tax component:
            <span> {formatCurrency(tax, restaurantCurrency)}</span>
          </h3> */}
          {/* {vatPercent > 0 ? (
            <h3 className="text-black text-md capitalize inline-flex gap-2 items-center justify-between">
              VAT estimate ({vatPercent}%):
              <span>
                {formatCurrency(computedBreakdown.vat, restaurantCurrency)}
              </span>
            </h3>
          ) : null} */}
          <h2 className="text-primary text-2xl capitalize inline-flex gap-2 items-center">
            Total payable:
            <span>
              {formatCurrency(displayTotalAmount || totalDisplayAmount, restaurantCurrency)}
            </span>
          </h2>
          
          {/* Show breakdown calculation - when numberOfBookings > 1 OR numberOfRecipients > 1 */}
          {(() => {
            const numRecipients = Number(bookingPayload?.numberOfRecipients || numberOfRecipients || 1);
            const numBookings = Number(bookingPayload?.numberOfBookings || 1);
            const bookingTypeVal = bookingPayload?.bookingType || bookingType;
            const deliveryTypeVal = bookingPayload?.deliveryType || "single";
            
            // Show breakdown when EITHER condition is met
            if (numBookings > 1 || numRecipients > 1) {
              const calculatedCartTotal = items.reduce(
                (total, item) => total + (item.pricePerUnit || 0) * (item.quantity || 1),
                0
              );
              
              // Calculate breakdown based on booking type and delivery type
              let breakdownTotal = 0;
              let breakdownText = "";
              
              if (bookingTypeVal === "public") {
                // For public: cartTotal * numBookings * numRecipients
                breakdownTotal = calculatedCartTotal * numBookings * numRecipients;
                breakdownText = `₦${calculatedCartTotal.toLocaleString()} × ${numBookings} bookings × ${numRecipients} recipients = ₦${breakdownTotal.toLocaleString()}`;
              } else if (bookingTypeVal === "others") {
                if (deliveryTypeVal === "multiple") {
                  // For multiple recipients: cartTotal * numBookings * numRecipients
                  breakdownTotal = calculatedCartTotal * numBookings * numRecipients;
                  breakdownText = `₦${calculatedCartTotal.toLocaleString()} × ${numBookings} bookings × ${numRecipients} recipients = ₦${breakdownTotal.toLocaleString()}`;
                } else {
                  // For single recipient: cartTotal * numBookings
                  breakdownTotal = calculatedCartTotal * numBookings;
                  breakdownText = `₦${calculatedCartTotal.toLocaleString()} × ${numBookings} bookings = ₦${breakdownTotal.toLocaleString()}`;
                }
              } else if (bookingTypeVal === "yourself" ||bookingTypeVal === "self") {
                // For yourself: cartTotal * numBookings
                breakdownTotal = calculatedCartTotal * numBookings;
                breakdownText = `₦${calculatedCartTotal.toLocaleString()} × ${numBookings} bookings = ₦${breakdownTotal.toLocaleString()}`;
              } else if (bookingTypeVal === "date") {
                // For date: cartTotal * numPeople
                breakdownTotal = calculatedCartTotal * numBookings;
                breakdownText = `₦${calculatedCartTotal.toLocaleString()} × ${numBookings} people = ₦${breakdownTotal.toLocaleString()}`;
              } else {
                breakdownTotal = calculatedCartTotal;
                breakdownText = `₦${calculatedCartTotal.toLocaleString()}`;
              }
              
              return (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Breakdown: </span>
                    {breakdownText}
                  </p>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      <div className="my-8 w-full relative bottom-4 px-4 md:block">
        {(paymentInitializing ||
          hostedPaymentStatus === "initializing" ||
          hostedPaymentStatus === "authorizing" ||
          hostedPaymentStatus === "verifying" ||
          hostedPaymentStatus === "awaiting_authorization") && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="text-xs text-blue-700">
                {hostedPaymentStatus === "awaiting_authorization"
                  ? "Secure payment window is open. Complete your payment to continue."
                  : "Contacting the payment provider..."}
              </p>
            </div>
          </div>
        )}
        {hostedPaymentError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {hostedPaymentError}
          </div>
        )}
        {/* Show booking status indicator */}
        {(getSessionBookingId() || urlBookingId) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-green-600 rounded-full flex-shrink-0"></div>
              <p className="text-green-700 text-xs">
                {urlBookingId ? "Existing booking loaded!" : "Booking secured!"}{" "}
                {paymentInitializing
                  ? "Initializing payment..."
                  : "Ready for payment."}
              </p>
            </div>
          </div>
        )}
        <CartButton
          // currency={restaurantCurrency}
          // className="!bg-[#522D8A] hover:bg-[#522D8A]/10"
          text={
            isCreatingBooking
              ? "Creating Booking..."
              : hostedPaymentStatus === "awaiting_authorization"
              ? "Payment In Progress..."
              : paymentInitializing
              ? "Preparing Payment..."
              : getSessionBookingId() || urlBookingId
              ? "Pay Securely"
              : "Create Booking & Pay"
          }
          customPrice={displayTotalAmount || totalDisplayAmount}
          customCount={
            urlBookingId && bookingData
              ? (() => {
                  const booking = Array.isArray(bookingData)
                    ? bookingData[0]
                    : bookingData;
                  return (
                    booking?.menuItems?.reduce(
                      (total: number, item: MenuItem) => {
                        const quantity = item.quantity || 1;
                        return total + quantity;
                      },
                      0
                    ) ||
                    booking?.numberOfBookings ||
                    1
                  );
                })()
              : items.reduce((total, item) => total + item.quantity, 0)
          }
          isValid={true}
          onClick={handlePayNow}
          disabled={
            isCreatingBooking ||
            paymentInitializing ||
            hostedPaymentStatus === "awaiting_authorization" ||
            hostedPaymentStatus === "verifying" ||
            hostedPaymentStatus === "authorizing"
          }
        />
      </div>
    </section>
    </>
  );
};

export default CheckoutDetails;
