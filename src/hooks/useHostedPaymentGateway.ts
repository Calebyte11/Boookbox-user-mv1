import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usersService } from "@/services/usersService";

export type HostedPaymentStatus =
  | "idle"
  | "initializing"
  | "awaiting_authorization"
  | "authorizing"
  | "verifying"
  | "success"
  | "failed"
  | "cancelled";

export type HostedPaymentVerification = {
  isPaid: boolean;
  statusText?: string;
  paymentReference?: string;
  transactionId?: string | number;
  raw: unknown;
  bookingId?: string;
};

export type HostedPaymentOptions = {
  provider?: string;
  paymentType?: string;
  serviceFee?: number;
  tax?: number;
  autoVerify?: boolean;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  onSuccess?: (payload: HostedPaymentVerification) => void;
  onFailure?: (error: { bookingId?: string; paymentReference?: string; reason: string }) => void;
  onPaymentSuccess?: (data: { reference?: string; trxref?: string; status?: string }) => void;
};

export type StartHostedPaymentParams = {
  bookingId: string;
  paymentReference?: string;
};

export type VerifyHostedPaymentParams = {
  silent?: boolean;
};

export type HostedPaymentResult = {
  status: HostedPaymentStatus;
  error: string | null;
  authorizationUrl: string | null;
  isModalOpen: boolean;
  paymentReference: string | null;
  latestVerification: HostedPaymentVerification | null;
  initializingPayload: unknown;
  isVerifying: boolean;
  startPayment: (params: StartHostedPaymentParams) => Promise<{ success: boolean; error?: string }>;
  verifyPayment: (params?: VerifyHostedPaymentParams) => Promise<HostedPaymentVerification | null>;
  confirmPaystackPayment: (txRef: string) => Promise<boolean>;
  closeModal: (opts?: { markCancelled?: boolean }) => void;
  reset: () => void;
  openAuthorizationInNewTab: () => void;
  handlePaymentSuccess: (data: { reference?: string; trxref?: string; status?: string }) => Promise<void>;
};

const DEFAULT_OPTIONS: Required<Pick<HostedPaymentOptions, "provider" | "paymentType" | "serviceFee" | "tax" | "autoVerify" | "pollIntervalMs" | "maxPollAttempts">> = {
  provider: "paystack",
  paymentType: "split",
  serviceFee: 0,
  tax: 0,
  autoVerify: true,
  pollIntervalMs: 5000,
  maxPollAttempts: 12,
};

const generatePaymentReference = () => `BX_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

const coerceString = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return undefined;
};

const extractAuthorizationUrl = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidates: Array<unknown> = [
    (payload as Record<string, unknown>).authorization_url,
    (payload as Record<string, unknown>).authorizationUrl,
    (payload as Record<string, unknown>).authorizationUrlFull,
    (payload as Record<string, unknown>).authorizationUrlRedirect,
    (payload as Record<string, unknown>).redirect_url,
    (payload as Record<string, unknown>).authorizationURL,
    (payload as Record<string, unknown>).auth_url,
  ];

  const nested = (payload as Record<string, unknown>).data;
  if (nested && typeof nested === "object") {
    candidates.push(
      (nested as Record<string, unknown>).authorization_url,
      (nested as Record<string, unknown>).authorizationUrl,
      (nested as Record<string, unknown>).redirect_url,
      (nested as Record<string, unknown>).authorizationURL,
      (nested as Record<string, unknown>).auth_url
    );
  }

  const urlCandidate = candidates.find((candidate) => typeof candidate === "string");
  return typeof urlCandidate === "string" ? urlCandidate : null;
};

const normalizeVerification = (
  response: unknown,
  fallbackReference?: string,
  bookingId?: string
): HostedPaymentVerification => {
  const payload = (response && typeof response === "object"
    ? ((response as Record<string, unknown>).data as Record<string, unknown>) || (response as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const statusCandidates: Array<unknown> = [
    payload.status,
    payload.paymentStatus,
    payload.payment_status,
    payload.state,
  ];

  const nested = payload.data;
  if (nested && typeof nested === "object") {
    statusCandidates.push(
      (nested as Record<string, unknown>).status,
      (nested as Record<string, unknown>).paymentStatus,
      (nested as Record<string, unknown>).payment_status
    );
  }

  const booking = payload.booking;
  if (booking && typeof booking === "object") {
    statusCandidates.push(
      (booking as Record<string, unknown>).status,
      (booking as Record<string, unknown>).paymentStatus,
      (booking as Record<string, unknown>).payment_status
    );
  }

  const statusText = coerceString(
    statusCandidates.find((candidate) => typeof candidate === "string")
  );

  const message = coerceString(payload.message);

  const isPaid = Boolean(
    payload.isPaid === true ||
      (nested && typeof nested === "object" && (nested as Record<string, unknown>).isPaid === true) ||
      (statusText && ["paid", "success", "completed"].includes(statusText.toLowerCase())) ||
      (message && message.toLowerCase().includes("already"))
  );

  const referenceCandidates: Array<unknown> = [
    payload.paymentReference,
    payload.payment_reference,
    payload.reference,
    payload.tx_ref,
    fallbackReference,
  ];

  if (nested && typeof nested === "object") {
    referenceCandidates.push(
      (nested as Record<string, unknown>).paymentReference,
      (nested as Record<string, unknown>).payment_reference,
      (nested as Record<string, unknown>).reference,
      (nested as Record<string, unknown>).tx_ref,
      fallbackReference
    );
  }

  const bookingData = payload.booking;
  if (bookingData && typeof bookingData === "object") {
    referenceCandidates.push(
      (bookingData as Record<string, unknown>).paymentReference,
      (bookingData as Record<string, unknown>).payment_reference,
      (bookingData as Record<string, unknown>).reference
    );
  }

  const paymentReference = coerceString(
    referenceCandidates.find((candidate) => typeof candidate === "string")
  );

  const transactionCandidates: Array<unknown> = [
    payload.transactionId,
    payload.transaction_id,
    payload.trans,
    payload.transaction,
    payload.txId,
  ];

  if (nested && typeof nested === "object") {
    transactionCandidates.push(
      (nested as Record<string, unknown>).transactionId,
      (nested as Record<string, unknown>).transaction_id,
      (nested as Record<string, unknown>).trans,
      (nested as Record<string, unknown>).transaction,
      (nested as Record<string, unknown>).txId
    );
  }

  if (bookingData && typeof bookingData === "object") {
    transactionCandidates.push(
      (bookingData as Record<string, unknown>).transactionId,
      (bookingData as Record<string, unknown>).transaction_id,
      (bookingData as Record<string, unknown>).trans,
      (bookingData as Record<string, unknown>).transaction
    );
  }

  const transactionId = (
    transactionCandidates.find((candidate) =>
      typeof candidate === "string" || typeof candidate === "number"
    ) as string | number | undefined
  ) ?? fallbackReference;

  return {
    isPaid,
    statusText,
    paymentReference: paymentReference ?? fallbackReference,
    transactionId,
    raw: response,
    bookingId,
  };
};

export const useHostedPaymentGateway = (
  options: HostedPaymentOptions = {}
): HostedPaymentResult => {
  const mergedOptions = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );

  const [status, setStatus] = useState<HostedPaymentStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [authorizationUrl, setAuthorizationUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentReference, setPaymentReference] = useState<string | null>(
    () => generatePaymentReference()
  );
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [latestVerification, setLatestVerification] =
    useState<HostedPaymentVerification | null>(null);
  const [initializingPayload, setInitializingPayload] = useState<unknown>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const pollIntervalRef = useRef<number | null>(null);
  const pollAttemptsRef = useRef(0);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);

  const verifyPayment = useCallback<HostedPaymentResult["verifyPayment"]>(
    async ({ silent = false }: VerifyHostedPaymentParams = {}) => {
      if (!currentBookingId || !paymentReference) {
        if (!silent) {
          setError("Cannot verify payment without an active booking.");
          setStatus("failed");
        }
        return null;
      }

      if (isVerifying) {
        return latestVerification;
      }

      setIsVerifying(true);
      setStatus("verifying");
      setError(null);

      try {
        const response = await usersService.verifyPayment(currentBookingId, {
          paymentReference: paymentReference ?? undefined,
        });
        const verification = normalizeVerification(
          response,
          paymentReference,
          currentBookingId
        );

        setLatestVerification(verification);

        if (verification.isPaid) {
          setStatus("success");
          setIsModalOpen(false);
          clearPolling();
          mergedOptions.onSuccess?.(verification);
        } else {
          setStatus("awaiting_authorization");
          if (!silent) {
            setError("Payment not completed yet. Please finish the payment and try again.");
          }
        }

        return verification;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("failed");
        clearPolling();
        mergedOptions.onFailure?.({
          bookingId: currentBookingId,
          paymentReference,
          reason: message,
        });
        return {
          isPaid: false,
          statusText: "error",
          paymentReference,
          transactionId: paymentReference,
          raw: err,
          bookingId: currentBookingId,
        };
      } finally {
        setIsVerifying(false);
      }
    },
    [clearPolling, currentBookingId, isVerifying, latestVerification, mergedOptions, paymentReference]
  );

  const startAutoVerification = useCallback(() => {
    clearPolling();
    pollAttemptsRef.current = 0;

    if (!mergedOptions.autoVerify || !currentBookingId) {
      return;
    }

    pollIntervalRef.current = window.setInterval(async () => {
      pollAttemptsRef.current += 1;
      const verification = await verifyPayment({ silent: true });

      if (verification?.isPaid) {
        clearPolling();
        return;
      }

      if (pollAttemptsRef.current >= mergedOptions.maxPollAttempts) {
        clearPolling();
        setError(
          "We couldn't confirm the payment automatically. Please tap Verify Payment once you're done."
        );
      }
    }, mergedOptions.pollIntervalMs) as unknown as number;
  }, [clearPolling, currentBookingId, mergedOptions, verifyPayment]);

  const startPayment = useCallback<HostedPaymentResult["startPayment"]>(
    async ({ bookingId, paymentReference: externalReference }) => {
      if (!bookingId) {
        const message = "Booking ID is required to initialize payment.";
        setError(message);
        setStatus("failed");
        return { success: false, error: message };
      }

      const reference = externalReference ?? generatePaymentReference();
      setPaymentReference(reference);
      setCurrentBookingId(bookingId);
      setStatus("initializing");
      setError(null);
      setLatestVerification(null);
      setInitializingPayload(null);

      try {
        const response = await usersService.initializeBookingPayment({
          bookingId,
          paymentReference: reference,
          provider: mergedOptions.provider,
          paymentType: mergedOptions.paymentType,
          serviceFee: mergedOptions.serviceFee,
          tax: mergedOptions.tax,
        });

        const payload =
          response && typeof response === "object" && "data" in response
            ? (response as Record<string, unknown>).data
            : response;

        setInitializingPayload(payload);

        if (
          response &&
          typeof response === "object" &&
          "success" in response &&
          response.success === false
        ) {
          const message =
            coerceString((response as Record<string, unknown>).error) ||
            "Failed to initialize payment. Please try again.";
          setError(message);
          setStatus("failed");
          return { success: false, error: message };
        }

        const authorization = extractAuthorizationUrl(payload);
        if (!authorization) {
          const message =
            "Payment provider did not return an authorization URL. Please contact support.";
          setError(message);
          setStatus("failed");
          return { success: false, error: message };
        }

        setAuthorizationUrl(authorization);
        setIsModalOpen(true);
        setStatus("awaiting_authorization");
        startAutoVerification();

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setStatus("failed");
        mergedOptions.onFailure?.({
          bookingId,
          paymentReference: reference,
          reason: message,
        });
        return { success: false, error: message };
      }
    },
    [mergedOptions, startAutoVerification]
  );

  const closeModal = useCallback<HostedPaymentResult["closeModal"]>(
    ({ markCancelled = true } = {}) => {
      setIsModalOpen(false);
      if (markCancelled && status !== "success") {
        setStatus("cancelled");
      }
      clearPolling();
    },
    [clearPolling, status]
  );

  const reset = useCallback(() => {
    clearPolling();
    setStatus("idle");
    setError(null);
    setAuthorizationUrl(null);
    setIsModalOpen(false);
    setCurrentBookingId(null);
    setLatestVerification(null);
    setInitializingPayload(null);
    setPaymentReference(generatePaymentReference());
  }, [clearPolling]);

  // Listen for payment return events to auto-close modal and start verification
  useEffect(() => {
    const handleClosePaymentModal = (event: CustomEvent) => {
      console.log("🔄 Payment modal close event received:", event.detail);
      
      // Only process if we have an active payment session
      if (isModalOpen && currentBookingId) {
        console.log("✅ Closing payment modal and starting verification...");
        
        // Close the modal immediately
        setIsModalOpen(false);
        
        // Start verification process
        verifyPayment({ silent: false });
      }
    };

    const handlePaymentReturn = (event: CustomEvent) => {
      console.log("🔄 Payment return event received:", event.detail);
      
      // Only process if we have an active payment session
      if (isModalOpen && currentBookingId) {
        const { params } = event.detail;
        const hasPaymentParams = params?.trxref || params?.reference || params?.status;
        
        if (hasPaymentParams) {
          console.log("✅ Payment return detected, closing modal and verifying...");
          
          // Close the modal immediately
          setIsModalOpen(false);
          
          // Start verification process
          verifyPayment({ silent: false });
        }
      }
    };

    // Add event listeners
    window.addEventListener("closePaymentModal", handleClosePaymentModal as EventListener);
    window.addEventListener("paymentReturn", handlePaymentReturn as EventListener);

    return () => {
      // Cleanup event listeners
      window.removeEventListener("closePaymentModal", handleClosePaymentModal as EventListener);
      window.removeEventListener("paymentReturn", handlePaymentReturn as EventListener);
    };
  }, [isModalOpen, currentBookingId, verifyPayment]);

  const openAuthorizationInNewTab = useCallback(() => {
    if (authorizationUrl) {
      window.open(authorizationUrl, "_blank", "noopener,noreferrer");
    }
  }, [authorizationUrl]);

  // New method to confirm Paystack payment directly
  const confirmPaystackPayment = useCallback<HostedPaymentResult["confirmPaystackPayment"]>(
    async (txRef: string) => {
      console.log('🔄 Confirming Paystack payment with reference:', txRef);
      setStatus("verifying");
      setError(null);

      try {
        await usersService.confirmPaystackPayment(txRef);
        
        // Create a verification result for success
        const verification: HostedPaymentVerification = {
          isPaid: true,
          statusText: "confirmed",
          paymentReference: txRef,
          transactionId: txRef,
          raw: { txRef, provider: "paystack" },
          bookingId: currentBookingId || undefined,
        };

        setLatestVerification(verification);
        setStatus("success");
        setIsModalOpen(false);
        clearPolling();
        mergedOptions.onSuccess?.(verification);

        console.log('✅ Paystack payment confirmed successfully');
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('❌ Failed to confirm Paystack payment:', message);
        setError(message);
        setStatus("failed");
        mergedOptions.onFailure?.({
          bookingId: currentBookingId || undefined,
          paymentReference: txRef,
          reason: message,
        });
        return false;
      }
    },
    [clearPolling, currentBookingId, mergedOptions]
  );

  // Handle payment success from iframe interceptor
  const handlePaymentSuccess = useCallback<HostedPaymentResult["handlePaymentSuccess"]>(
    async (data: { reference?: string; trxref?: string; status?: string }) => {
      console.log('🎉 Payment success detected from iframe:', data);
      
      const txRef = data.reference || data.trxref;
      if (!txRef) {
        console.error('❌ No transaction reference found in payment success data');
        setError("Payment completed but no transaction reference found");
        setStatus("failed");
        return;
      }

      // Use the new confirmation method instead of verification
      const success = await confirmPaystackPayment(txRef);
      if (!success) {
        console.error('❌ Failed to confirm payment after iframe success');
      }
    },
    [confirmPaystackPayment]
  );

  return {
    status,
    error,
    authorizationUrl,
    isModalOpen,
    paymentReference,
    latestVerification,
    initializingPayload,
    isVerifying,
    startPayment,
    verifyPayment,
    confirmPaystackPayment,
    closeModal,
    reset,
    openAuthorizationInNewTab,
    handlePaymentSuccess,
  };
};
