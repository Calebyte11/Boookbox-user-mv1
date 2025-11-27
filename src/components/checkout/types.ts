import type { BookingDetail } from "@/types/ticket";
import type { CartItem } from "@/store/cartStore";

export interface PricingResult {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
}

export interface ExistingBookingPricingProps {
  bookingData: BookingDetail[] | BookingDetail;
  onPricingCalculated: (result: PricingResult) => void;
}

export interface NewBookingPricingProps {
  cartItems: CartItem[];
  bookingType?: string;
  numberOfRecipients?: number;
  bookingData?: BookingDetail[] | BookingDetail;
  defaultServiceFeePercent: number;
  defaultTaxAmount: number;
  onPricingCalculated: (result: PricingResult) => void;
}