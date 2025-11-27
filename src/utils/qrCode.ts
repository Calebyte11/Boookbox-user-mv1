import QRCode from "qrcode";
import BrandSvg from "@/assets/svg/LogoText.svg";


/**
 * QR Code generation options
 */
export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  // Optional: SVG string or image URL to embed in the center of the QR code
  centerImageSrc?: string;
  centerImageSize?: number; // Size in px (width/height)
}

/**
 * User information for QR code
 */
export interface QRUserInfo {
  userId: string;
  fullName: string;
  email: string;
  accountType?: "user" | "organization";
  organizationName?: string;
  contactEmail?: string;
}

/**
 * QR Code data structure for tickets
 */
export interface TicketQRData {
  ticketId: string;
}

/**
 * Default QR code options for tickets
 */
const DEFAULT_QR_OPTIONS: QRCodeOptions = {
  width: 350,
  margin: 2,
  color: {
    dark: "#000",
    light: "#FFFFFF",
  },
  errorCorrectionLevel: "H", // High error correction for center image
  centerImageSrc: BrandSvg,
  centerImageSize: 50,
};

/**
 * Generate QR code data URL for a ticket
 * @param ticketId - The unique ticket identifier
 * @param userInfo - User information to include in the QR code
 * @param options - QR code generation options
 * @returns Promise<string> - Base64 data URL of the QR code
 */
export const generateTicketQRCode = async (
  ticketId: string,
  // userInfo: QRUserInfo,
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    if (!ticketId || typeof ticketId !== "string") {
      throw new Error("Invalid ticket ID provided");
    }

    // Use ticket ID directly as QR string (no JSON wrapper)
    const qrString = ticketId; // Merge options with defaults
    const finalOptions = { ...DEFAULT_QR_OPTIONS, ...options };

    // Generate QR code as data URL (without center image first)
    const qrOptions = { ...finalOptions };
    delete qrOptions.centerImageSrc;
    delete qrOptions.centerImageSize;

    const qrCodeDataURL = await QRCode.toDataURL(qrString, qrOptions);

    // Add center image if specified
    if (finalOptions.centerImageSrc) {
      const qrWithCenterImage = await addCenterImageToQRCode(
        qrCodeDataURL,
        finalOptions.centerImageSrc,
        finalOptions.centerImageSize || 48,
        finalOptions.width || 256
      );
      return qrWithCenterImage;
    }

    return qrCodeDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error(
      `Failed to generate QR code: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Generate QR code as SVG string for a ticket
 * @param ticketId - The unique ticket identifier
 * @param userInfo - User information to include in the QR code
 * @param options - QR code generation options
 * @returns Promise<string> - SVG string of the QR code
 */
export const generateTicketQRCodeSVG = async (
  ticketId: string,
  options: QRCodeOptions = {}
): Promise<string> => {
  try {
    if (!ticketId || typeof ticketId !== "string") {
      throw new Error("Invalid ticket ID provided");
    }

    // Use ticket ID directly as QR string (no JSON wrapper)
    const qrString = ticketId;

    // Merge options with defaults
    const finalOptions = { ...DEFAULT_QR_OPTIONS, ...options };

    // Generate QR code as SVG
    const qrCodeSVG = await QRCode.toString(qrString, {
      type: "svg",
      ...finalOptions,
    });

    return qrCodeSVG;
  } catch (error) {
    console.error("Error generating QR code SVG:", error);
    throw new Error(
      `Failed to generate QR code SVG: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

/**
 * Parse QR code data to extract ticket information
 * @param qrString - The QR code string data
 * @returns TicketQRData | null - Parsed ticket data or null if invalid
 */
export const parseTicketQRCode = (qrString: string): TicketQRData | null => {
  try {
    // Since we now store just the ticket ID as a string, validate it directly
    if (
      qrString &&
      typeof qrString === "string" &&
      qrString.trim().length > 0
    ) {
      return {
        ticketId: qrString.trim(),
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing QR code data:", error);
    return null;
  }
};

/**
 * Validate if a string contains valid ticket QR data
 * @param qrString - The QR code string data
 * @returns boolean - True if valid ticket QR data
 */
export const isValidTicketQRCode = (qrString: string): boolean => {
  const parsedData = parseTicketQRCode(qrString);
  return parsedData !== null;
};

/**
 * Create QRUserInfo from user profile data
 * @param userProfile - User profile data from API
 * @returns QRUserInfo - Formatted user info for QR code
 */
export const createQRUserInfo = (userProfile: {
  _id?: string;
  id?: string;
  fullName?: string;
  username?: string;
  email: string;
  accountType?: "user" | "organization";
  role?: "user" | "organization";
  organizationName?: string;
  contactEmail?: string;
}): QRUserInfo => {
  return {
    userId: userProfile._id || userProfile.id || "",
    fullName: userProfile.fullName || userProfile.username || "User",
    email: userProfile.email,
    accountType:
      userProfile.accountType ||
      (userProfile.role === "organization" ? "organization" : "user"),
    organizationName: userProfile.organizationName,
    contactEmail: userProfile.contactEmail,
  };
};

/**
 * Add center image to QR code data URL
 * @param qrCodeDataURL - Base64 data URL of the QR code
 * @param centerImageSrc - Image source (URL, base64, or SVG)
 * @param centerImageSize - Size of the center image in pixels
 * @param qrCodeSize - Size of the QR code
 * @returns Promise<string> - Base64 data URL of QR code with center image
 */
const addCenterImageToQRCode = async (
  qrCodeDataURL: string,
  centerImageSrc: string,
  centerImageSize: number = 48,
  qrCodeSize: number = 256
): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      canvas.width = qrCodeSize;
      canvas.height = qrCodeSize;

      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";

      qrImage.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, qrCodeSize, qrCodeSize);

        const centerImage = new Image();
        centerImage.crossOrigin = "anonymous";

        centerImage.onload = () => {
          // Calculate center position
          const centerX = (qrCodeSize - centerImageSize) / 2;
          const centerY = (qrCodeSize - centerImageSize) / 2;

          // Add white background circle for better visibility
          const padding = 8;
          const circleRadius = (centerImageSize + padding) / 2;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(qrCodeSize / 2, qrCodeSize / 2, circleRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Add subtle border
          ctx.strokeStyle = "#000";
          // "#e5e5e5";
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw center image
          ctx.drawImage(
            centerImage,
            centerX,
            centerY,
            centerImageSize,
            centerImageSize
          );

          // Convert to data URL
          const finalDataURL = canvas.toDataURL("image/png", 1.0);
          resolve(finalDataURL);
        };

        centerImage.onerror = () => {
          // If center image fails to load, return QR code without center image
          resolve(qrCodeDataURL);
        };

        centerImage.src = centerImageSrc;
      };

      qrImage.onerror = () => {
        reject(new Error("Failed to load QR code image"));
      };

      qrImage.src = qrCodeDataURL;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Example usage: Generate a QR code with center logo
 * @param ticketId - The ticket ID to encode
 * @returns Promise<string> - QR code data URL with center image
 */
export const generateTicketQRCodeWithLogo = async (
  ticketId: string
): Promise<string> => {
  return generateTicketQRCode(ticketId, {
    width: 300,
    centerImageSize: 60,
    errorCorrectionLevel: "H",
  });
};

/**
 * Example usage: Generate a simple QR code without center image
 * @param ticketId - The ticket ID to encode
 * @returns Promise<string> - Simple QR code data URL
 */
export const generateSimpleTicketQRCode = async (
  ticketId: string
): Promise<string> => {
  return generateTicketQRCode(ticketId, {
    centerImageSrc: undefined, // No center image
  });
};
