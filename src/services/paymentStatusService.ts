/* eslint-disable @typescript-eslint/no-explicit-any */
import { usersService } from "@/services/usersService";

export interface PaymentStatusResult {
  isPaid: boolean;
  paymentStatus?: string;
  transactionId?: string;
  paymentReference?: string;
  error?: string;
}

/**
 * Utility service to check payment status by various identifiers
 * This provides a fallback mechanism when payment callbacks fail
 */
export class PaymentStatusService {
  /**
   * Check payment status by booking ID
   */
  static async checkByBookingId(
    bookingId: string
  ): Promise<PaymentStatusResult> {
    try {
      const booking = await usersService.viewBooking(bookingId);
      const bookingData = Array.isArray(booking) ? booking[0] : booking;

      return {
        isPaid:
          bookingData?.paymentStatus === "paid" ||
          bookingData?.status === "paid" ||
          bookingData?.isPaid === true,
        paymentStatus: bookingData?.paymentStatus || bookingData?.status,
        transactionId: bookingData?.transactionId,
        paymentReference: bookingData?.paymentReference,
      };
    } catch (error) {
      console.error("Error checking payment status by booking ID:", error);
      return {
        isPaid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check payment status by payment reference
   * Note: This functionality is not yet implemented in the backend
   */
  static async checkByPaymentReference(): Promise<PaymentStatusResult> {
    try {
      // This would require a backend endpoint to check by payment reference
      // For now, we'll use the booking ID approach as a fallback
      console.warn(
        "Payment reference lookup not implemented, using booking ID fallback"
      );
      return {
        isPaid: false,
        error: "Payment reference lookup not available",
      };
    } catch (error) {
      console.error("Error checking payment status by reference:", error);
      return {
        isPaid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Poll payment status with exponential backoff
   */
  static async pollPaymentStatus(
    bookingId: string,
    maxAttempts: number = 10,
    initialDelay: number = 1000
  ): Promise<PaymentStatusResult> {
    let attempts = 0;
    let delay = initialDelay;

    while (attempts < maxAttempts) {
      try {
        const result = await this.checkByBookingId(bookingId);

        if (result.isPaid) {
          console.log(`✅ Payment confirmed after ${attempts + 1} attempts`);
          return result;
        }

        if (result.error) {
          console.warn(
            `⚠️ Error checking payment status (attempt ${attempts + 1}):`,
            result.error
          );
        }

        attempts++;

        if (attempts < maxAttempts) {
          console.log(
            `🔄 Payment not yet confirmed, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 10000); // Cap at 10 seconds
        }
      } catch (error) {
        console.error(`❌ Polling attempt ${attempts + 1} failed:`, error);
        attempts++;

        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * 1.5, 10000);
        }
      }
    }

    console.warn(
      `⚠️ Payment status polling completed without confirmation after ${maxAttempts} attempts`
    );
    return {
      isPaid: false,
      error: "Payment status could not be confirmed within the timeout period",
    };
  }

  /**
   * Check if a booking exists and get its current state
   */
  static async validateBooking(bookingId: string): Promise<{
    exists: boolean;
    booking?: any;
    error?: string;
  }> {
    try {
      const booking = await usersService.viewBooking(bookingId);
      return {
        exists: !!booking,
        booking: Array.isArray(booking) ? booking[0] : booking,
      };
    } catch (error) {
      console.error("Error validating booking:", error);
      return {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export default PaymentStatusService;
