import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * VerifyPayment - Handles payment callback redirect
 * This page is called when user returns from payment provider
 * with URL parameters like trxref, reference, etc.
 */
const VerifyPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract payment parameters from URL
    const trxref = searchParams.get("trxref");
    const reference = searchParams.get("reference");
    const status = searchParams.get("status");

    console.log("🔄 Payment callback received:", { trxref, reference, status });

    // Dispatch custom event to trigger payment verification
    // This will be caught by the payment handling logic
    if (trxref || reference) {
      window.dispatchEvent(
        new CustomEvent("paymentReturn", {
          detail: {
            params: Object.fromEntries(searchParams.entries()),
            timestamp: Date.now(),
          },
        })
      );

      // Close any open payment modal and start verification
      window.dispatchEvent(
        new CustomEvent("closePaymentModal", {
          detail: {
            trxref,
            reference,
            status,
          },
        })
      );
    }

    // Redirect back to checkout page after a brief delay
    // The checkout page will handle the verification
    setTimeout(() => {
      // Check if there's a bookingId in the params to preserve context
      const bookingId = searchParams.get("bookingId");
      const redirectUrl = bookingId ? `/checkout?bookingId=${bookingId}` : "/checkout";
      
      // Navigate with payment params preserved for the checkout to handle
      const newSearchParams = new URLSearchParams();
      searchParams.forEach((value, key) => {
        newSearchParams.set(key, value);
      });
      
      navigate(`${redirectUrl}&${newSearchParams.toString()}`, { replace: true });
    }, 100);
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-gray-600">Processing your payment...</p>
      </div>
    </div>
  );
};

export default VerifyPayment;