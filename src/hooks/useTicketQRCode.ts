import { useState, useEffect, useCallback } from "react";
import { generateTicketQRCodeWithLogo, createQRUserInfo } from "@/utils/qrCode";
import type { QRCodeOptions, QRUserInfo } from "@/utils/qrCode";
import { useAuth } from "@/features/auth/hooks";
import { useUserProfileQuery } from "@/hooks/useUserQueries";

interface StoredQRCode {
  ticketId: string;
  qrCodeDataURL: string;
  timestamp: number;
  expiresAt?: number;
}

const QR_STORAGE_KEY = "bookbox_ticket_qr_codes";
const DEFAULT_EXPIRY_HOURS = 24; // QR codes expire after 24 hours

export interface UseTicketQRCodeReturn {
  qrCodeDataURL: string | null;
  isGenerating: boolean;
  error: string | null;
  generateOrRetrieveQRCode: (
    ticketId: string,
    options?: QRCodeOptions & { forceRegenerate?: boolean }
  ) => Promise<void>;
  clearQRCode: () => void;
  clearError: () => void;
  hasQRCode: boolean;
  userInfo: QRUserInfo | null;
}

/**
 * Custom hook for managing ticket QR codes with browser storage
 * Automatically stores and retrieves QR codes from localStorage
 */
export const useTicketQRCode = (): UseTicketQRCodeReturn => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  // Get user info from auth store and profile
  const { user } = useAuth();
  const { data: profileData } = useUserProfileQuery();
  // Create user info for QR code
  const userInfo: QRUserInfo | null = (() => {
    if (profileData?.data) {
      return createQRUserInfo({
        _id: profileData.data._id || profileData.data.id,
        fullName:
          profileData.data.fullName || profileData.data.username || "User",
        email: profileData.data.email,
        accountType:
          profileData.data.accountType ||
          (profileData.data.role === "organization" ? "organization" : "user"),
        organizationName: profileData.data.organizationName,
        contactEmail: profileData.data.contactEmail,
      });
    } else if (user) {
      return createQRUserInfo({
        id: user.id,
        fullName: user.username || "User", // Use username as fallback for fullName
        email: user.email,
        accountType: user.role === "organization" ? "organization" : "user",
      });
    }
    return null;
  })();

  /**
   * Get stored QR codes from localStorage
   */
  const getStoredQRCodes = useCallback((): StoredQRCode[] => {
    try {
      const stored = localStorage.getItem(QR_STORAGE_KEY);
      if (!stored) return [];

      const qrCodes: StoredQRCode[] = JSON.parse(stored);
      const now = Date.now();

      // Filter out expired QR codes
      const validQRCodes = qrCodes.filter((qr) => {
        if (qr.expiresAt && qr.expiresAt < now) {
          return false;
        }
        return true;
      });

      // Update storage if we filtered out expired codes
      if (validQRCodes.length !== qrCodes.length) {
        localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(validQRCodes));
      }

      return validQRCodes;
    } catch (error) {
      console.error("Error reading QR codes from localStorage:", error);
      return [];
    }
  }, []);

  /**
   * Store QR code in localStorage
   */
  const storeQRCode = useCallback(
    (ticketId: string, qrCodeDataURL: string) => {
      try {
        const storedQRCodes = getStoredQRCodes();
        const now = Date.now();
        const expiresAt = now + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000;

        // Remove existing QR code for this ticket
        const filteredQRCodes = storedQRCodes.filter(
          (qr) => qr.ticketId !== ticketId
        );

        // Add new QR code
        const newQRCode: StoredQRCode = {
          ticketId,
          qrCodeDataURL,
          timestamp: now,
          expiresAt,
        };

        const updatedQRCodes = [...filteredQRCodes, newQRCode];

        // Keep only the most recent 10 QR codes to prevent excessive storage usage
        const limitedQRCodes = updatedQRCodes
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);

        localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(limitedQRCodes));
      } catch (error) {
        console.error("Error storing QR code in localStorage:", error);
      }
    },
    [getStoredQRCodes]
  );

  /**
   * Get QR code for specific ticket from storage
   */
  const getStoredQRCode = useCallback(
    (ticketId: string): string | null => {
      const storedQRCodes = getStoredQRCodes();
      const qrCode = storedQRCodes.find((qr) => qr.ticketId === ticketId);
      return qrCode?.qrCodeDataURL || null;
    },
    [getStoredQRCodes]
  );
  /**
   * Generate or retrieve QR code for ticket
   */
  const generateOrRetrieveQRCode = useCallback(
    async (
      ticketId: string,
      options?: QRCodeOptions & { forceRegenerate?: boolean }
    ) => {
      if (!ticketId) {
        setError("Ticket ID is required");
        return;
      }

      if (!userInfo) {
        setError("User information is required to generate QR code");
        return;
      }

      setCurrentTicketId(ticketId);
      setError(null);

      // Check if we should force regeneration
      const forceRegenerate = options?.forceRegenerate || false;

      // Try to get existing QR code if not forcing regeneration
      if (!forceRegenerate) {
        const storedQRCode = getStoredQRCode(ticketId);
        if (storedQRCode) {
          setQrCodeDataURL(storedQRCode);
          return;
        }
      }

      // Generate new QR code
      setIsGenerating(true);
      try {
        // Generate new QR code with logo
        const dataURL = await generateTicketQRCodeWithLogo(ticketId);
        setQrCodeDataURL(dataURL);

        // Store in localStorage
        storeQRCode(ticketId, dataURL);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate QR code";
        setError(errorMessage);
        console.error("QR code generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [getStoredQRCode, storeQRCode, userInfo]
  );

  /**
   * Clear current QR code data
   */
  const clearQRCode = useCallback(() => {
    setQrCodeDataURL(null);
    setCurrentTicketId(null);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if we have a QR code loaded
  const hasQRCode = Boolean(qrCodeDataURL);

  // Load QR code on mount if we have a current ticket ID
  useEffect(() => {
    if (currentTicketId && !qrCodeDataURL) {
      const storedQRCode = getStoredQRCode(currentTicketId);
      if (storedQRCode) {
        setQrCodeDataURL(storedQRCode);
      }
    }
  }, [currentTicketId, qrCodeDataURL, getStoredQRCode]);
  return {
    qrCodeDataURL,
    isGenerating,
    error,
    generateOrRetrieveQRCode,
    clearQRCode,
    clearError,
    hasQRCode,
    userInfo,
  };
};
