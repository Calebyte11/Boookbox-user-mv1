import { useEffect } from "react";
import type { ExistingBookingPricingProps } from "./types";

/**
 * Component to handle pricing for existing bookings.
 * Uses totalAmount, deliveryFee, and boookboxFee directly from the API to avoid discrepancies.
 */
export const ExistingBookingPricing: React.FC<ExistingBookingPricingProps> = ({
  bookingData,
  onPricingCalculated,
}) => {
  useEffect(() => {
    if (!bookingData) return;

    // Extract booking from array if needed
    const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
    
    if (!booking) return;

    // Use API data directly to avoid discrepancies
    const subtotal = booking.totalAmount || 0;
    const deliveryFee = booking.deliveryFee || 0;
    const serviceFee = booking.boookboxFee || 0; // boookboxFee is the service fee
    const tax = 0; // Tax is typically included in totalAmount

    console.log('ExistingBookingPricing: Using API totals', {
      subtotal,
      deliveryFee,
      serviceFee,
      bookingId: booking.bookingId
    });

    onPricingCalculated({
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
    });
  }, [bookingData, onPricingCalculated]);

  // This component doesn't render anything, it's just for logic
  return null;
};