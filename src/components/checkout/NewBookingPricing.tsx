import { useEffect } from "react";
import { calculateServiceFee } from "@/utils/calculateTotalPayment";
import type { NewBookingPricingProps } from "./types";

/**
 * Component to handle pricing calculations for new bookings.
 * Uses cart data and business logic to calculate totals.
 */
export const NewBookingPricing: React.FC<NewBookingPricingProps> = ({
  cartItems,
  bookingType,
  numberOfRecipients,
  bookingData,
  defaultServiceFeePercent,
  defaultTaxAmount,
  onPricingCalculated,
}) => {
  useEffect(() => {
    // Calculate base total from cart items
    const baseTotal = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    
    // Apply recipient multiplier for genuine multi-recipient scenarios
    let subtotal: number;
    if (bookingType === "public" && numberOfRecipients && numberOfRecipients > 1) {
      subtotal = baseTotal * numberOfRecipients;
    } else {
      // For single recipient, "yourself", or undefined booking types, just use base total
      subtotal = baseTotal;
    }

    // Determine if delivery is needed
    const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
    const isDelivery =
      booking &&
      typeof booking === "object" &&
      "reason" in booking &&
      typeof booking.reason === "string"
        ? booking.reason.toLowerCase().includes("delivery")
        : false;

    // Calculate fees
    const deliveryFee = isDelivery ? 1000 : 0;
    const serviceFee = calculateServiceFee(subtotal, deliveryFee, {
      serviceFeePercent: defaultServiceFeePercent,
    });
    const tax = defaultTaxAmount;

    console.log('NewBookingPricing: Calculated totals', {
      baseTotal,
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
      bookingType,
      numberOfRecipients,
      isDelivery
    });

    onPricingCalculated({
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
    });
  }, [
    cartItems,
    bookingType,
    numberOfRecipients,
    bookingData,
    defaultServiceFeePercent,
    defaultTaxAmount,
    onPricingCalculated,
  ]);

  // This component doesn't render anything, it's just for logic
  return null;
};