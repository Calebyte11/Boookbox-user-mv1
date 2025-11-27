/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import brandlogo from "@/assets/svg/Brand.svg";
import useCartStore, {
  selectTotalCartPriceWithRecipients,
} from "@/store/cartStore";
import useBookingStore from "@/store/bookingStore";
import { useNavigate } from "react-router-dom";
import { usersService } from "@/services/usersService";
import { useReceiptStore } from "@/store/receiptStore";
import { useConfirmPayment } from "@/hooks/useUserQueries";
import {
  calculatePaymentBreakdown,
  calculateServiceFee,
  getDefaultServiceFeePercent,
  getDefaultTaxAmount,
} from "@/utils/calculateTotalPayment";
// import {} from "use"

interface FlutterWaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
}

export const useFlutterWave = (
  overrideAmount?: number,
  existingBookingId?: string,
  restaurantCurrency?: string
) => {
  const [isScriptReady, setIsScriptReady] = useState(() => {
    // Initialize with current script state
    return (
      typeof window !== "undefined" && !!(window as any).FlutterwaveCheckout
    );
  });
  const [currentPaymentRef, setCurrentPaymentRef] = useState<string | null>(
    null
  );
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

  // Load Flutterwave script dynamically with better error handling
  useEffect(() => {
    // Check if script is already loaded and working
    if (typeof window !== "undefined" && (window as any).FlutterwaveCheckout) {
      setIsScriptReady(true);
      return;
    }

    // Check if script element already exists
    const existingScript = document.querySelector(
      'script[src="https://checkout.flutterwave.com/v3.js"]'
    );

    if (existingScript) {
      // Script exists but FlutterwaveCheckout not available, wait a bit
      const checkInterval = setInterval(() => {
        if (
          typeof window !== "undefined" &&
          (window as any).FlutterwaveCheckout
        ) {
          setIsScriptReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      // Clean up interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
      return;
    }

    // Create and load script
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;

    script.onload = () => {
      // console.log("Flutterwave script loaded successfully");
      setIsScriptReady(true);
    };

    script.onerror = (error) => {
      console.error("Failed to load Flutterwave script:", error);
      setIsScriptReady(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup function
      const scriptToRemove = document.querySelector(
        'script[src="https://checkout.flutterwave.com/v3.js"]'
      );
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, []);
  const cartState = useCartStore();
  const cartTotalAmount = selectTotalCartPriceWithRecipients(
    cartState,
    numberOfRecipients || 1,
    bookingType
  );

  // Use override amount if provided, otherwise use cart total
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

  // Check if amount is already in kobo (from calculateTotalPayment with toSmallestUnit: true)
  // If overrideAmount is provided and > 10000, assume it's already in kobo and convert back to naira
  // FlutterWave expects amount in naira, so convert back if needed
  const amountForFlutterWave = totalAmount;
  // Use recipient details from booking store or fallback to user details
  // For public bookings, we always use user details since recipient info is optional
  const customerEmail = user?.email || "";
  const customerPhone = user?.phone || "07000000000";
  const customerName = user?.username || "Customer";

  // Generate a detailed description for the payment
  const paymentDescription = `${isGift ? "Gift delivery" : "Food order"} from ${
    restaurantName || "Restaurant"
  } - ${items.length} item(s)${
    deliveryDate ? ` scheduled for ${deliveryDate}` : ""
  }`;
  // Generate payment reference that can be accessed before payment
  const generatePaymentReference = () => {
    const ref = `BX_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    setCurrentPaymentRef(ref);
    return ref;
  };
  // Initiate payment with backend (call this before showing Flutterwave modal)
  const initiatePayment = async () => {
    try {
      const paymentRef = generatePaymentReference();

      // Try multiple sources for booking ID
      let bookingIdToUse = existingBookingId || storeBookingId;

      // If still no booking ID, try to get from session storage
      if (!bookingIdToUse) {
        try {
          // Try to find booking ID in session storage using a pattern
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("booking_")) {
              const value = sessionStorage.getItem(key);
              if (value && value.length > 10) {
                // Basic validation for booking ID format
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

      // console.log("📤 Initiating payment with backend:", {
      //   bookingId: bookingIdToUse,
      //   paymentReference: paymentRef,
      //   amount: totalAmount,
      // });

      await usersService.initializeBookingPayment({
        bookingId: bookingIdToUse,
        paymentReference: paymentRef,
        provider: "flutterwave",
        paymentType: "split",
        serviceFee: Number(paymentBreakdown.serviceFee.toFixed(2)),
        tax,
      });

      // console.log("✅ Payment initiated successfully:", initResult);
      return { success: true, paymentReference: paymentRef };
    } catch (error) {
      // console.error("❌ Failed to initiate payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }; // Confirm payment with backend (call this after successful payment)
  // Use the React Query mutation for payment confirmation and cache invalidation
  const confirmPaymentMutation = useConfirmPayment();
  const confirmPayment = async (flutterwaveResponse: any) => {
    try {
      // console.log("📤 Confirming payment with backend:", {
      //   transactionId: flutterwaveResponse.transaction_id,
      //   paymentReference: flutterwaveResponse.tx_ref,
      //   status: flutterwaveResponse.status,
      // });

      if (
        flutterwaveResponse.status !== "completed" &&
        flutterwaveResponse.status !== "successful"
      ) {
        // console.error(
        //   "❌ Payment not successful, cannot confirm payment. Status:",
        //   flutterwaveResponse.status
        // );
        return {
          success: false,
          error: `Payment not successful. Status: ${flutterwaveResponse.status}`,
        };
      }

      // Get current booking ID for query invalidation
      const activeBookingId = existingBookingId || storeBookingId;

      // Use the mutation hook instead of direct service call for proper query invalidation
      return new Promise<{ success: boolean; data?: any; error?: string }>(
        (resolve) => {
          confirmPaymentMutation.mutate(
            {
              transactionId: flutterwaveResponse.transaction_id,
              paymentReference: flutterwaveResponse.tx_ref,
              flutterwaveResponse: flutterwaveResponse.status,
              bookingId: activeBookingId, // Include bookingId for query invalidation
            },
            {
              onSuccess: (data) => {
                console.log("✅ Payment confirmed successfully:", data);
                resolve({ success: true, data });
              },
              onError: (error: any) => {
                console.error("❌ Payment confirmation failed:", error);
                resolve({
                  success: false,
                  error: error?.message || String(error),
                });
              },
            }
          );
        }
      );
    } catch (error) {
      console.error("❌ Failed to confirm payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
  const initializePayment = async () => {
    console.log("🚀 Initializing payment with:", {
      totalAmount,
      customerEmail,
      customerPhone,
      customerName,
      bookingType,
      storeBookingId,
      existingBookingId,
    });

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

    // Check if Flutterwave is available
    if (typeof window === "undefined" || !(window as any).FlutterwaveCheckout) {
      return {
        success: false,
        error: "Payment system not ready. Please wait and try again.",
      };
    }

    // Step 1: Initiate payment with backend
    const initResult = await initiatePayment();
    if (!initResult.success) {
      return initResult;
    }

    const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

    // Get current booking ID for redirect URL
    const currentBookingId = existingBookingId || storeBookingId;

    console.log(
      "🔑 Using Flutterwave public key:",
      publicKey.substring(0, 20) + "..."
    );
    const config: FlutterWaveConfig & {
      callback?: (response: any) => void;
      onclose?: () => void;
      redirect_url?: string;
    } = {
      public_key: publicKey,
      tx_ref: currentPaymentRef || initResult.paymentReference!,
      amount: amountForFlutterWave,
      currency: restaurantCurrency || "NGN",
      payment_options: "card,mobilemoney,ussd",
      redirect_url: `${window.location.origin}/checkout?bookingId=${currentBookingId}&payment=flutterwave`,
      customer: {
        email: customerEmail,
        phone_number: customerPhone,
        name: customerName,
      },
      customizations: {
        title: "BookBox Payment",
        description: paymentDescription,
        logo: brandlogo,
      },
      callback: async (response: any) => {
        console.log(
          "💳 Payment callback triggered with status:",
          response.status
        );
        console.log("� Payment response:", response);

        if (
          response.status === "successful" ||
          response.status === "completed"
        ) {
          console.log("✅ Payment successful, confirming with backend...");

          // Step 2: Confirm payment with backend
          const confirmResult = await confirmPayment(response);

          if (confirmResult.success) {
            // Store receipt in zustand before clearing booking/cart and navigating
            useReceiptStore.getState().setReceipt({
              transactionId: response.transaction_id,
              paymentReference: response.tx_ref,
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
                totalMeals: items.reduce(
                  (total, item) => total + item.quantity,
                  0
                ),
                restaurantName: restaurantName ?? null,
                bookingType: bookingType,
                numberOfRecipients: numberOfRecipients,
              },
            });

            console.log("✅ Payment confirmed with backend successfully");

            // Clear booking and cart after successful payment confirmation
            clearBookingAndPayload();
            clearCart();

            // Navigate to success page
            navigate("/payment-success");
          } else {
            console.error(
              "❌ Payment confirmation failed:",
              confirmResult.error
            );
            // Navigate to failed page with confirmation error
            navigate("/payment-failed", {
              state: {
                error: `Payment confirmation failed: ${confirmResult.error}`,
                transactionId: response.transaction_id,
                bookingDetails: {
                  recipientDetails,
                  deliveryDate,
                  deliveryTime,
                  totalAmount,
                },
              },
            });
          }
        } else {
          console.log("❌ Payment not successful, status:", response.status);
          navigate("/payment-failed", {
            state: {
              error: `Payment failed with status: ${response.status}`,
              bookingDetails: {
                recipientDetails,
                deliveryDate,
                deliveryTime,
                totalAmount,
              },
            },
          });
        }
      },
      onclose: () => {
        console.log("Payment modal closed by user");
      },
    };

    try {
      (window as any).FlutterwaveCheckout(config);
      return { success: true };
    } catch (error) {
      console.error("Flutterwave initialization error:", error);
      return { success: false, error: "Failed to initialize payment" };
    }
  };
  return {
    initializePayment,
    generatePaymentReference,
    currentPaymentRef,
    totalAmount,
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
    isReady: isScriptReady && !!user,
    hasValidBooking: !!user,
  };
};
