/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useBookingDetailQuery } from "@/hooks/useUserQueries";
import useBookingStore from "@/store/bookingStore";
import { useCartStore } from "@/store/cartStore";
import { useReceiptStore } from "@/store/receiptStore";

interface PaymentReturnState {
  isProcessing: boolean;
  hasChecked: boolean;
  paymentStatus: "pending" | "success" | "failed" | "unknown";
}

/**
 * Custom hook to handle payment return flows for Flutterwave and Paystack
 * This runs on every app load/reload to check for completed payments
 */
export const usePaymentReturnHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearBookingAndPayload } = useBookingStore();
  const { clearCart } = useCartStore();

  const [returnState, setReturnState] = useState<PaymentReturnState>({
    isProcessing: false,
    hasChecked: false,
    paymentStatus: "unknown",
  });

  // Extract payment parameters from URL
  const flutterwaveStatus = searchParams.get("status");
  const flutterwaveTxRef = searchParams.get("tx_ref");
  const flutterwaveTransactionId = searchParams.get("transaction_id");

  const paystackReference = searchParams.get("reference");
  const paystackTrxref = searchParams.get("trxref");

  // Check for booking ID in URL or session storage
  const urlBookingId = searchParams.get("bookingId");

  const getSessionBookingId = useCallback(() => {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("booking_")) {
          const value = sessionStorage.getItem(key);
          if (value && value.length > 10) {
            return value;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting session booking ID:", error);
      return null;
    }
  }, []);

  const activeBookingId = urlBookingId || getSessionBookingId();

  // Query booking details if we have a booking ID
  const {
    data: bookingData,
    isLoading: isLoadingBooking,
    refetch: refetchBooking,
  } = useBookingDetailQuery(activeBookingId || "", {
    enabled: !!activeBookingId,
  });

  // Check if this is a payment return based on URL parameters
  const isPaymentReturn = !!(
    flutterwaveStatus ||
    flutterwaveTxRef ||
    paystackReference ||
    paystackTrxref
  );

  // Main payment return handler
  const handlePaymentReturn = useCallback(async () => {
    if (!isPaymentReturn || returnState.hasChecked) return;

    console.log("🔄 Handling payment return...", {
      flutterwaveStatus,
      flutterwaveTxRef,
      paystackReference,
      activeBookingId,
    });

    setReturnState((prev) => ({
      ...prev,
      isProcessing: true,
      hasChecked: true,
    }));

    try {
      // Case 1: Flutterwave return
      if (flutterwaveStatus && flutterwaveTxRef) {
        if (
          flutterwaveStatus === "successful" ||
          flutterwaveStatus === "completed"
        ) {
          console.log("✅ Flutterwave payment appears successful");
          setReturnState((prev) => ({ ...prev, paymentStatus: "success" }));

          if (activeBookingId) {
            // Wait for booking data and check payment status
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay
            await refetchBooking();
          } else {
            // No booking ID found, but payment was successful
            toast({
              title: "Payment Successful",
              description: "Your payment was processed successfully.",
              variant: "success",
            });
            navigate("/home");
          }
        } else {
          console.log("❌ Flutterwave payment failed:", flutterwaveStatus);
          setReturnState((prev) => ({ ...prev, paymentStatus: "failed" }));

          toast({
            title: "Payment Failed",
            description: `Payment was not successful. Status: ${flutterwaveStatus}`,
            variant: "error",
          });

          // Stay on current page to allow retry
          return;
        }
      }

      // Case 2: Paystack return
      else if (paystackReference) {
        console.log("✅ Paystack payment return detected");
        setReturnState((prev) => ({ ...prev, paymentStatus: "success" }));

        if (activeBookingId) {
          // Wait for booking data and check payment status
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Brief delay
          await refetchBooking();
        } else {
          toast({
            title: "Payment Successful",
            description: "Your payment was processed successfully.",
            variant: "success",
          });
          navigate("/home");
        }
      }

      // Case 3: Direct booking ID check (user returned manually)
      else if (activeBookingId && !isLoadingBooking) {
        console.log("🔍 Checking booking status for returned user...");
        await refetchBooking();
      }
    } catch (error) {
      console.error("Error handling payment return:", error);
      setReturnState((prev) => ({ ...prev, paymentStatus: "failed" }));

      toast({
        title: "Error",
        description: "Failed to verify payment status. Please contact support.",
        variant: "error",
      });
    }
  }, [
    isPaymentReturn,
    returnState.hasChecked,
    flutterwaveStatus,
    flutterwaveTxRef,
    paystackReference,
    activeBookingId,
    refetchBooking,
    isLoadingBooking,
    toast,
    navigate,
  ]);

  // Check booking payment status and navigate accordingly
  useEffect(() => {
    if (!bookingData || isLoadingBooking) return;

    const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
    const isPaid =
      booking?.paymentStatus === "paid" ||
      booking?.status === "paid" ||
      booking?.isPaid;

    console.log("📊 Booking payment status:", {
      bookingId: activeBookingId,
      isPaid,
      paymentStatus: booking?.paymentStatus,
      status: booking?.status,
    });

    if (isPaid && returnState.isProcessing) {
      console.log("✅ Payment confirmed! Redirecting to success page...");

      // Store receipt data
      useReceiptStore.getState().setReceipt({
        transactionId: flutterwaveTransactionId || paystackReference || "N/A",
        paymentReference: flutterwaveTxRef || paystackReference || "N/A",
        paymentDate: new Date().toISOString(),
        bookingDetails: {
          recipientDetails: null,
          deliveryDate: booking?.validityDate?.start || null,
          deliveryTime: null,
          specialInstructions: booking?.specialInstructions || null,
          totalAmount: booking?.totalAmount || 0,
          items: booking?.menuItems || [],
          itemCount: booking?.menuItems?.length || 0,
          totalMeals:
            booking?.menuItems?.reduce(
              (sum: number, item: any) => sum + (item.quantity || 1),
              0
            ) || 0,
          restaurantName:
            booking?.restaurantName ||
            booking?.bookedAtRestaurant?.name ||
            null,
          bookingType: booking?.bookingType,
          numberOfRecipients: booking?.numberOfBookings || 1,
        },
      });

      // Clear app state
      clearBookingAndPayload();
      clearCart();

      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      ["status", "tx_ref", "transaction_id", "reference", "trxref"].forEach(
        (param) => {
          newSearchParams.delete(param);
        }
      );

      // Navigate to success page with booking ID
      navigate(`/payment-success?bookingId=${activeBookingId}`, {
        replace: true,
        state: {
          fromPaymentReturn: true,
          transactionId: flutterwaveTransactionId || paystackReference,
          paymentReference: flutterwaveTxRef || paystackReference,
        },
      });

      setReturnState((prev) => ({
        ...prev,
        isProcessing: false,
        paymentStatus: "success",
      }));
    } else if (
      !isPaid &&
      returnState.isProcessing &&
      returnState.paymentStatus === "success"
    ) {
      // Payment gateway says success but booking not marked as paid
      // Continue polling for a bit longer
      console.log(
        "⏳ Payment gateway successful but booking not yet updated, continuing to poll..."
      );
    }
  }, [
    bookingData,
    isLoadingBooking,
    returnState.isProcessing,
    returnState.paymentStatus,
    activeBookingId,
    flutterwaveTransactionId,
    flutterwaveTxRef,
    paystackReference,
    searchParams,
    navigate,
    clearBookingAndPayload,
    clearCart,
  ]);

  // Run payment return handler on mount and when parameters change
  useEffect(() => {
    handlePaymentReturn();
  }, [handlePaymentReturn]);

  // Stop processing after reasonable timeout
  useEffect(() => {
    if (returnState.isProcessing) {
      const timeout = setTimeout(() => {
        if (returnState.paymentStatus === "success") {
          console.log(
            "⚠️ Timeout waiting for booking confirmation, proceeding anyway..."
          );

          toast({
            title: "Payment Processing",
            description:
              "Your payment is being processed. Please check your bookings in a few minutes.",
            variant: "default",
          });

          // Clear URL and go to bookings page
          const newSearchParams = new URLSearchParams(searchParams);
          ["status", "tx_ref", "transaction_id", "reference", "trxref"].forEach(
            (param) => {
              newSearchParams.delete(param);
            }
          );

          navigate("/bookings/gifts", { replace: true });
        }

        setReturnState((prev) => ({ ...prev, isProcessing: false }));
      }, 30000); // 30 second timeout

      return () => clearTimeout(timeout);
    }
  }, [
    returnState.isProcessing,
    returnState.paymentStatus,
    searchParams,
    navigate,
    toast,
  ]);

  // Polling effect for when payment is processing
  useEffect(() => {
    if (returnState.isProcessing && activeBookingId) {
      const pollInterval = setInterval(() => {
        console.log("🔄 Polling payment status...");
        refetchBooking();
      }, 2000); // Poll every 2 seconds

      return () => clearInterval(pollInterval);
    }
  }, [returnState.isProcessing, activeBookingId, refetchBooking]);

  return {
    isProcessingPaymentReturn: returnState.isProcessing,
    paymentReturnStatus: returnState.paymentStatus,
    isPaymentReturn,
    activeBookingId,
  };
};
