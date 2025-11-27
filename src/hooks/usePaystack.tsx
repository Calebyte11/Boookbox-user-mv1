/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { usePaystackPayment } from "react-paystack";
import useAuthStore from "@/store/authStore";
import useCartStore, {
  selectTotalCartPriceWithRecipients,
} from "@/store/cartStore";
import useBookingStore from "@/store/bookingStore";
import { useNavigate } from "react-router-dom";
import { usersService } from "@/services/usersService";
import { useConfirmPayment } from "./useUserQueries";
import { useReceiptStore } from "@/store/receiptStore";
import {
  calculatePaymentBreakdown,
  calculateServiceFee,
  getDefaultServiceFeePercent,
  getDefaultTaxAmount,
} from "@/utils/calculateTotalPayment";

export const usePaystack = (
  overrideAmount?: number,
  existingBookingId?: string,
  restaurantCurrency?: string
) => {
  // Initialize reference immediately to ensure consistency
  const [currentPaymentRef, setCurrentPaymentRef] = useState<string | null>(
    () => {
      // Generate reference on first render to ensure consistency
      return `BX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
  );

  // State to track payment initialization
  const [paystackSubaccountCode, setPaystackSubaccountCode] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const {
    recipientDetails,
    deliveryDate,
    deliveryTime,
    specialInstructions,
    restaurantName,
    isGift,
    bookingType,
    numberOfRecipients,
    bookingId: storeBookingId,
    bookingPayload,
    clearBookingAndPayload,
  } = useBookingStore();
  const navigate = useNavigate();

  const cartState = useCartStore();
  const cartTotalAmount = selectTotalCartPriceWithRecipients(
    cartState,
    numberOfRecipients || 1,
    bookingType
  );

  const defaultServiceFeePercent = getDefaultServiceFeePercent();
  const defaultTaxAmount = getDefaultTaxAmount();

  const rawDeliveryFee =
    bookingPayload && typeof bookingPayload === "object"
      ? (bookingPayload as Record<string, unknown>).deliveryFee
      : undefined;
  const deliveryFee = (() => {
    if (typeof rawDeliveryFee === "number" && Number.isFinite(rawDeliveryFee)) {
      return rawDeliveryFee;
    }
    if (typeof rawDeliveryFee === "string" && rawDeliveryFee.trim().length > 0) {
      const parsed = Number(rawDeliveryFee);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  })();

  const rawTax =
    bookingPayload && typeof bookingPayload === "object"
      ? (bookingPayload as Record<string, unknown>).tax
      : undefined;
  const tax = (() => {
    if (typeof rawTax === "number" && Number.isFinite(rawTax)) {
      return rawTax;
    }
    if (typeof rawTax === "string" && rawTax.trim().length > 0) {
      const parsed = Number(rawTax);
      return Number.isFinite(parsed) ? parsed : defaultTaxAmount;
    }
    return defaultTaxAmount;
  })();

  const derivedServiceFee = calculateServiceFee(cartTotalAmount, deliveryFee, {
    serviceFeePercent: defaultServiceFeePercent,
  });

  const paymentBreakdown = calculatePaymentBreakdown(
    cartTotalAmount,
    deliveryFee,
    tax,
    derivedServiceFee,
    { serviceFeePercent: defaultServiceFeePercent }
  );

  const overrideAmountValue = overrideAmount ?? null;
  const isAlreadyInKobo =
    overrideAmountValue !== null && overrideAmountValue > 10000;

  const totalAmount =
    overrideAmountValue !== null
      ? isAlreadyInKobo
        ? overrideAmountValue / 100
        : overrideAmountValue
      : paymentBreakdown.totalPayable;

  // Convert amount to kobo (Paystack requires amount in kobo)
  const amountInKobo =
    overrideAmountValue !== null
      ? Math.round(
          isAlreadyInKobo
            ? overrideAmountValue
            : overrideAmountValue * 100
        )
      : paymentBreakdown.totalPayableInSmallestUnit;

  // Use recipient details from booking store or fallback to user details
  const customerEmail = user?.email || "";
  // const customerPhone = user?.phone || "07000000000";
  // const customerName = user?.username || "Customer";

  // Paystack configuration
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  // Generate payment reference that can be accessed before payment
  const generatePaymentReference = () => {
    // If reference already exists, return it (don't generate a new one)
    if (currentPaymentRef) {
      return currentPaymentRef;
    }
    const ref = `BX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setCurrentPaymentRef(ref);
    return ref;
  };

  // Initiate payment with backend (call this before showing Paystack modal)
  const initiatePayment = async () => {
    try {
      // Reset any previous errors
      setInitializationError(null);
      
      // Use the existing reference (no need to generate a new one)
      const paymentRef = currentPaymentRef!;

      // Try multiple sources for booking ID
      let bookingIdToUse = existingBookingId || storeBookingId;

      // If still no booking ID, try to get from session storage
      if (!bookingIdToUse) {
        try {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("booking_")) {
              const value = sessionStorage.getItem(key);
              if (value && value.length > 10) {
                bookingIdToUse = value;
                console.log(
                  "Found booking ID in session storage:",
                  bookingIdToUse
                );
                break;
              }
            }
          }
        } catch (error) {
          console.warn("Error checking session storage for booking ID:", error);
        }
      }

      if (!bookingIdToUse) {
        throw new Error("No booking ID found - cannot initiate payment");
      }

      const result = await usersService.initializeBookingPayment({
        bookingId: bookingIdToUse,
        paymentReference: paymentRef,
        paymentType: "split",
        serviceFee: Number(paymentBreakdown.serviceFee.toFixed(2)),
        tax,
      });
      
      if (!result.success) {
        throw new Error(result.error || "Failed to initiate payment");
      }

      // Check if subaccount code is N/A
      if (result.data.paystack_subaccount_code === "N/A") {
        console.warn("⚠️ Subaccount code is N/A - payment will not be split to restaurant", {
          bookingId: bookingIdToUse,
          restaurantName: restaurantName || "Unknown"
        });
        setInitializationError("Payment cannot be processed at this time. Restaurant subaccount not configured. Please contact support.");
        return { 
          success: false, 
          error: "Payment cannot be processed at this time. Restaurant subaccount not configured. Please contact support.",
          paystack_subaccount_code: result.data.paystack_subaccount_code 
        };
      }

      // Set the subaccount code in state
      setPaystackSubaccountCode(result.data.paystack_subaccount_code);
      
      console.log("✅ Payment splitting configured:", {
        subaccount: result.data.paystack_subaccount_code,
        amount: amountInKobo,
        platformFee: Math.round(amountInKobo * 0.015),
        restaurantWillReceive: amountInKobo - Math.round(amountInKobo * 0.015)
      });
      
      return { 
        success: true, 
        paymentReference: paymentRef, 
        paystack_subaccount_code: result.data.paystack_subaccount_code 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setInitializationError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // Confirm payment with backend (call this after successful payment)
  // Use the React Query mutation for payment confirmation and cache invalidation
  const confirmPaymentMutation = useConfirmPayment();
  const confirmPayment = async (paystackResponse: any) => {
    return new Promise<{ success: boolean; data?: any; error?: string }>(
      (resolve) => {
        // Get current booking ID for query invalidation
        const activeBookingId = existingBookingId || storeBookingId;

        confirmPaymentMutation.mutate(
          {
            transactionId:
              paystackResponse.trans || paystackResponse.transaction,
            paymentReference:
              paystackResponse.reference || currentPaymentRef || "",
            flutterwaveResponse:
              paystackResponse.status === "success"
                ? "completed"
                : paystackResponse.status,
            bookingId: activeBookingId, // Include bookingId for query invalidation
          },
          {
            onSuccess: (data) => {
              resolve({ success: true, data });
            },
            onError: (error: any) => {
              resolve({
                success: false,
                error: error?.message || String(error),
              });
            },
          }
        );
      }
    );
  };

  // Handle successful payment
  const onSuccess = async (reference: any) => {
    // Step 2: Confirm payment with backend
    const confirmResult = await confirmPayment(reference);

    if (confirmResult.success) {
      // Store receipt in zustand before clearing booking/cart and navigating
      useReceiptStore.getState().setReceipt({
        transactionId: reference.trans || reference.transaction,
        paymentReference: reference.reference || currentPaymentRef || "",
        paymentDate: new Date().toISOString(),
        bookingDetails: {
          recipientDetails,
          deliveryDate: deliveryDate ?? null,
          deliveryTime: deliveryTime ?? null,
          specialInstructions: specialInstructions ?? null,
          totalAmount,
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
          restaurantName: restaurantName ?? null,
          bookingType: bookingType,
          numberOfRecipients: numberOfRecipients,
        },
      });

      console.log("✅ Payment confirmed with backend successfully");

      // Clear booking and cart after successful payment confirmation
      clearBookingAndPayload(); // Clear local booking state
      clearCart(); // Clear cart state

      // Navigate to success page
      navigate("/payment-success");
    } else {
      console.error("❌ Payment confirmation failed:", confirmResult.error);
      // Navigate to failed page with confirmation error
      navigate("/payment-failed", {
        state: {
          error: `Payment confirmation failed: ${confirmResult.error}`,
          transactionId: reference.trans || reference.transaction,
          bookingDetails: {
            recipientDetails,
            deliveryDate,
            deliveryTime,
            totalAmount,
          },
        },
      });
    }
  };

  // Handle payment closure (user closed modal)
  const onClose = () => {
    console.log("Payment modal closed by user");
  };

  // Get current booking ID for payment configuration
  // const currentBookingId = existingBookingId || storeBookingId;

  // Initialize Paystack payment hook at the top level (hooks must be called unconditionally)
  const initializePaystackHook = usePaystackPayment({
    reference: currentPaymentRef!,
    email: customerEmail,
    amount: amountInKobo,
    publicKey: publicKey!,
    currency: restaurantCurrency === "NGN" ? "NGN" : "NGN",
    channels: ["card", "bank", "ussd", "qr", "mobile_money"],
    // metadata: {
    //   custom_fields: [
    //     {
    //       display_name: "Customer Name",
    //       variable_name: "customer_name",
    //       value: customerName,
    //     },
    //     {
    //       display_name: "Phone Number",
    //       variable_name: "phone_number",
    //       value: customerPhone,
    //     },
    //     {
    //       display_name: "Booking Type",
    //       variable_name: "booking_type",
    //       value: bookingType || "regular",
    //     },
    //     {
    //       display_name: "Restaurant",
    //       variable_name: "restaurant",
    //       value: restaurantName || "Unknown",
    //     },
    //     {
    //       display_name: "Items Count",
    //       variable_name: "items_count",
    //       value: items.length.toString(),
    //     },
    //     {
    //       display_name: "Booking ID",
    //       variable_name: "booking_id",
    //       value: currentBookingId || "N/A",
    //     },
    //   ],
    // },
    // Proper subaccount configuration for payment splitting
    subaccount: paystackSubaccountCode && paystackSubaccountCode !== "N/A" ? paystackSubaccountCode : undefined,
    bearer: paystackSubaccountCode && paystackSubaccountCode !== "N/A" ? "subaccount" : "account",
    transaction_charge: paystackSubaccountCode && paystackSubaccountCode !== "N/A" ? 100000 : 0, // 1.5% platform fee
  });  // Main payment initialization function
  const initializePaystackPayment = async () => {

    // Validation checks
    if (totalAmount <= 0) {
      console.error(
        "❌ Payment amount must be greater than 0, got:",
        totalAmount
      );
      return { success: false, error: "Invalid payment amount" };
    }

    if (!user) {
      console.error("❌ User authentication is required for payment");
      return { success: false, error: "User authentication required" };
    }

    if (!customerEmail) {
      console.error("❌ Customer email is required for Paystack payment");
      return { success: false, error: "Customer email required" };
    }

    // Step 1: Initiate payment with backend using the current reference
    const initResult = await initiatePayment();
    if (!initResult.success) {
      return initResult;
    }

    // Check if there's an initialization error (like N/A subaccount code)
    if (initializationError) {
      return { success: false, error: initializationError };
    }
  

    try {
      // Trigger Paystack payment with callbacks
      initializePaystackHook({
        onSuccess,
        onClose,
      });
      return { success: true };
    } catch (error) {
      console.error("Paystack initialization error:", error);
      return { success: false, error: "Failed to initialize payment" };
    }
  };

  return {
    initializePayment: initializePaystackPayment,
    generatePaymentReference,
    currentPaymentRef,
    totalAmount,
    amountInKobo,
    paystackSubaccountCode,
    initializationError,
    bookingDetails: {
      recipientDetails,
      deliveryDate,
      deliveryTime,
      specialInstructions,
      restaurantName,
      isGift,
      bookingType,
      itemCount: items.length,
    },
    isReady: !!user && !!customerEmail && !!publicKey,
    hasValidBooking: !!user,
  };
};
