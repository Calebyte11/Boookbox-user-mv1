import { useState, useCallback } from "react";
import {
  generateTicketQRCodeWithLogo,
  generateTicketQRCodeSVG,
  createQRUserInfo,
} from "@/utils/qrCode";
import type { QRCodeOptions, QRUserInfo } from "@/utils/qrCode";
import { useAuth } from "@/features/auth/hooks";
import { useUserProfileQuery } from "@/hooks/useUserQueries";

export interface UseQRCodeReturn {
  qrCodeDataURL: string | null;
  qrCodeSVG: string | null;
  isGenerating: boolean;
  error: string | null;
  generateQRCode: (ticketId: string, options?: QRCodeOptions) => Promise<void>;
  generateQRCodeSVG: (
    ticketId: string,
    options?: QRCodeOptions
  ) => Promise<void>;
  clearQRCode: () => void;
  clearError: () => void;
  userInfo: QRUserInfo | null;
}

/**
 * Custom hook for QR code generation and management
 * @returns UseQRCodeReturn - QR code state and actions
 */
export const useQRCode = (): UseQRCodeReturn => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);
  const [qrCodeSVG, setQrCodeSVG] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user info from auth store and profile
  const { user } = useAuth();
  const { data: profileData } = useUserProfileQuery();

  // Create user info for QR code
  const userInfo: QRUserInfo | null = (() => {
    if (profileData?.data) {
      return createQRUserInfo(profileData.data);
    } else if (user) {
      return createQRUserInfo({
        id: user.id,
        fullName: profileData?.fullName || user.username || "<Unknown>",
        email: profileData?.email || user.email,
        accountType: user.role === "organization" ? "organization" : "user",
      });
    }
    return null;
  })();
  /**
   * Generate QR code as data URL
   */
  const generateQRCode = useCallback(
    async (ticketId: string) => {
      if (!ticketId) {
        setError("Ticket ID is required");
        return;
      }

      if (!userInfo) {
        setError("User information is required to generate QR code");
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const dataURL = await generateTicketQRCodeWithLogo(ticketId);
        setQrCodeDataURL(dataURL);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate QR code";
        setError(errorMessage);
        console.error("QR code generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [userInfo]
  );
  /**
   * Generate QR code as SVG
   */
  const generateQRCodeSVG = useCallback(
    async (ticketId: string, options?: QRCodeOptions) => {
      if (!ticketId) {
        setError("Ticket ID is required");
        return;
      }

      if (!userInfo) {
        setError("User information is required to generate QR code");
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const svg = await generateTicketQRCodeSVG(ticketId, options);
        setQrCodeSVG(svg);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate QR code SVG";
        setError(errorMessage);
        console.error("QR code SVG generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [userInfo]
  );

  /**
   * Clear QR code data
   */
  const clearQRCode = useCallback(() => {
    setQrCodeDataURL(null);
    setQrCodeSVG(null);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  return {
    qrCodeDataURL,
    qrCodeSVG,
    isGenerating,
    error,
    generateQRCode,
    generateQRCodeSVG,
    clearQRCode,
    clearError,
    userInfo,
  };
};
