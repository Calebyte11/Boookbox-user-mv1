import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { HostedPaymentStatus } from "@/hooks/useHostedPaymentGateway";

const STATUS_COPY: Record<HostedPaymentStatus, string> = {
  idle: "Click pay to begin.",
  initializing: "Contacting payment provider...",
  awaiting_authorization: "Complete your payment in the window below.",
  authorizing: "Awaiting confirmation from the provider...",
  verifying: "Verifying your payment...",
  success: "Payment confirmed!",
  failed: "We couldn't start the payment.",
  cancelled: "Payment was cancelled.",
};

const formatStatus = (status: HostedPaymentStatus) => {
  return STATUS_COPY[status] ?? "";
};

export type PaymentAuthorizationModalProps = {
  isOpen: boolean;
  authorizationUrl: string | null;
  status: HostedPaymentStatus;
  error?: string | null;
  onClose: () => void;
  onVerify: () => void;
  onOpenInNewTab?: () => void;
  onPaymentSuccess?: (data: { reference?: string; trxref?: string; status?: string }) => void;
  isVerifying?: boolean;
};

export const PaymentAuthorizationModal = ({
  isOpen,
  authorizationUrl,
  status,
  error,
  onClose,
//   onVerify,
//   onOpenInNewTab,
  onPaymentSuccess,
//   isVerifying = false,
}: PaymentAuthorizationModalProps) => {
  const [isFrameLoading, setIsFrameLoading] = useState<boolean>(true);
  const [frameError, setFrameError] = useState<string | null>(null);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState<boolean>(false);
  const loadTimerRef = useRef<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const statusMessage = useMemo(() => {
    if (isConfirmingPayment) {
      return "Confirming payment...";
    }
    return formatStatus(status);
  }, [status, isConfirmingPayment]);

  console.log(statusMessage);

  // Function to extract transaction reference from URL or message
  const extractTransactionReference = useCallback((data: unknown): string | null => {
    if (typeof data === 'string') {
      // Try to extract from URL-like string
      const urlMatch = data.match(/[?&](reference|trxref|tx_ref)=([^&]+)/);
      if (urlMatch) return urlMatch[2];
    }
    
    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      return (obj.reference as string) || (obj.trxref as string) || (obj.tx_ref as string) || null;
    }
    
    return null;
  }, []);

  // Handle iframe navigation and message events
  useEffect(() => {
    if (!isOpen || !authorizationUrl) return;

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Paystack domains
      const allowedOrigins = [
        'https://checkout.paystack.com',
        'https://js.paystack.co',
        'https://paystack.com'
      ];
      
      if (!allowedOrigins.some(origin => event.origin.startsWith(origin))) {
        return;
      }

    //   console.log('💳 Paystack iframe message received:', event.data);

      try {
        let data = event.data;
        
        // Handle string data that might be JSON
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            // Not JSON, handle as string
          }
        }

        // Check for success indicators
        const isSuccess = (
          (data && typeof data === 'object' && (data as Record<string, unknown>).status === 'success') ||
          (data && typeof data === 'object' && (data as Record<string, unknown>).response === 'Approved') ||
          (data && typeof data === 'object' && (data as Record<string, unknown>).event === 'charge.success') ||
          (typeof data === 'string' && data.includes('status=success'))
        );

        if (isSuccess) {
          const txRef = extractTransactionReference(data);
        //   console.log('✅ Payment success detected, reference:', txRef);
          
          if (txRef) {
            setIsConfirmingPayment(true);
            onPaymentSuccess?.({ 
              reference: txRef, 
              trxref: txRef, 
              status: 'success' 
            });
          }
        }
      } catch (err) {
        console.error('Error processing iframe message:', err);
      }
    };

    // Handle iframe URL changes (if iframe allows access)
    const checkIframeURL = () => {
      try {
        const iframe = iframeRef.current;
        if (iframe && iframe.contentWindow) {
          const iframeUrl = iframe.contentWindow.location.href;
          
          // Check if URL indicates successful payment
          if (iframeUrl.includes('status=success') || iframeUrl.includes('response=Approved')) {
            const urlParams = new URLSearchParams(iframeUrl.split('?')[1] || '');
            const reference = urlParams.get('reference') || urlParams.get('trxref');
            
            if (reference) {
            //   console.log(' Payment success detected via URL change, reference:', reference);
              setIsConfirmingPayment(true);
              onPaymentSuccess?.({ 
                reference, 
                trxref: reference, 
                status: 'success' 
              });
            }
          }
        }
      } catch {
        // Expected to fail due to CORS, but we try anyway
        // console.log('Cannot access iframe URL (expected due to CORS)');
      }
    };

    // Add event listeners
    window.addEventListener('message', handleMessage);
    
    // Check iframe URL periodically (will mostly fail due to CORS)
    const urlCheckInterval = setInterval(checkIframeURL, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(urlCheckInterval);
    };
  }, [isOpen, authorizationUrl, onPaymentSuccess, extractTransactionReference]);

  useEffect(() => {
    setFrameError(null);
    setIsFrameLoading(true);
    setIsConfirmingPayment(false);

    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current);
    }

    if (!authorizationUrl) {
      setFrameError("Payment authorization link is unavailable.");
      setIsFrameLoading(false);
      return;
    }

    return () => {
      if (loadTimerRef.current) {
        window.clearTimeout(loadTimerRef.current);
        loadTimerRef.current = null;
      }
    };
  }, [authorizationUrl]);

  if (!isOpen) {
    return null;
  }

  return (
<div className="fixed inset-1 z-[1200] flex items-center justify-center bg-black/80">
  <div className="flex w-full h-full backdrop-blur-sm">
    {/* Close button */}
    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      aria-label="Close payment window"
    >
      <span className="text-xl font-bold">×</span>
    </button>

    {/* Iframe Container */}
    <div className="relative flex h-full w-full items-center justify-center">
      {authorizationUrl ? (
        <>
          <iframe
            ref={iframeRef}
            key={authorizationUrl}
            title="Payment authorization"
            src={authorizationUrl}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            onLoad={() => {
              setIsFrameLoading(false);
              if (loadTimerRef.current) {
                window.clearTimeout(loadTimerRef.current);
                loadTimerRef.current = null;
              }
            }}
          />

          {/* Loading State */}
          {isFrameLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/70">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
              <p className="text-sm text-gray-600">
                Loading secure payment page...
              </p>
            </div>
          )}

          {/* Confirming Payment */}
          {isConfirmingPayment && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/90">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-300 border-t-green-600" />
              <p className="text-sm font-medium text-green-700">
                Confirming payment...
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-base font-medium text-gray-700">
            We couldn't load the payment link.
          </p>
          <p className="text-sm text-gray-500">
            Please close this window and try starting the payment again.
          </p>
        </div>
      )}

      {(frameError || error) && (
        <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow">
          {frameError || error}
        </div>
      )}
    </div>
  </div>
</div>


  );
};
