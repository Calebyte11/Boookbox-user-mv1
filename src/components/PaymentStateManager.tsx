// import { useEffect } from "react";
import { usePaymentReturnHandler } from "@/hooks/usePaymentReturnHandler";

/**
 * PaymentStateManager - Add this component to your main App component
 * This component runs on every app load to handle payment returns
 */
const PaymentStateManager = () => {
  const {
    isProcessingPaymentReturn,
    // paymentReturnStatus,
    // isPaymentReturn,
    // activeBookingId,
  } = usePaymentReturnHandler();

//   useEffect(() => {
//     if (isPaymentReturn) {
//       console.log("🔄 Payment return detected:", {
//         isProcessing: isProcessingPaymentReturn,
//         status: paymentReturnStatus,
//         bookingId: activeBookingId,
//       });
//     }
//   }, [
//     isPaymentReturn,
//     isProcessingPaymentReturn,
//     paymentReturnStatus,
//     activeBookingId,
//   ]);

  // Show loading indicator during payment processing
  if (isProcessingPaymentReturn) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
          <p className="text-gray-600 text-sm">
            Verifying your payment status...
          </p>
          <p className="text-gray-500 text-xs mt-2">
            This may take a few moments
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentStateManager;
