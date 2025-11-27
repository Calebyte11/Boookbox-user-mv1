import React from "react";
import { Loader2 } from "lucide-react";

export interface QRCodeDisplayProps {
  qrCodeDataURL: string | null;
  qrCodeSVG?: string | null;
  isGenerating: boolean;
  error?: string | null;
  ticketId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  show?: boolean;
}

const sizeClasses = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
};

/**
 * QR Code Display Component
 * Displays QR codes with loading states and error handling
 * Exportable component for reuse across the application
 */
const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeDataURL,
  qrCodeSVG,
  isGenerating,
  error,
  ticketId,
  size = "lg",
  className = "",
  show = false,
}) => {
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* QR Code Container */}
      <div
        className={`${sizeClasses[size]} flex items-center justify-center rounded-lg`}
      >
        {isGenerating ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-gray-600">Generating QR Code...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center space-y-2 p-4 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-sm">!</span>
            </div>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        ) : qrCodeDataURL ? (
          <img
            src={qrCodeDataURL}
            alt={`QR Code for ticket ${ticketId || ""}`}
            className="w-full h-full object-contain p-2"
            crossOrigin="anonymous"
            onLoad={() => {
              // Ensure image is loaded for html2canvas
            }}
          />
        ) : qrCodeSVG ? (
          <div
            className="w-full h-full p-2"
            dangerouslySetInnerHTML={{ __html: qrCodeSVG }}
          />
        ) : (
          <div className="flex flex-col items-center space-y-2 text-gray-400">
            <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
            <span className="text-sm">No QR Code</span>
          </div>
        )}
      </div>

      {/* Ticket ID Display */}
      {show && ticketId && (
        <div className="text-center">
          <p className="text-xs text-gray-500">Ticket ID</p>
          <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
            {ticketId}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
