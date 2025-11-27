import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MapPin, X, AlertCircle, Settings } from "lucide-react";

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<boolean>;
  onSkip?: () => void;
  permissionStatus: "granted" | "denied" | "prompt" | "unknown";
  isRetry?: boolean;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
  isOpen,
  onClose,
  onRequestPermission,
  onSkip,
  permissionStatus,
  isRetry = false,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Detect if user is on mobile
  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    try {
      const success = await onRequestPermission();
      if (success) {
        onClose();
      } else if (permissionStatus === "denied") {
        setShowInstructions(true);
      }
    } catch (error) {
      console.error("Permission request failed:", error);
      if (permissionStatus === "denied") {
        setShowInstructions(true);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    if (isMobile) {
      alert(
        "Please go to your browser settings → Site settings → Location → Allow for BoookBox"
      );
    } else {
      alert(
        "Please click the location icon in your browser's address bar and select 'Allow'"
      );
    }
    onClose();
  };

  const getContent = () => {
    if (showInstructions || (isRetry && permissionStatus === "denied")) {
      return {
        title: "Location Access Blocked",
        description:
          "Location access was blocked. To enable location services:",
        content: (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Manual Setup Required</p>
                  <p className="mt-1">
                    {isMobile
                      ? "Go to your browser settings and enable location for this site"
                      : "Click the location icon in your browser's address bar and select 'Allow'"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleOpenSettings}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                Open Settings
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        ),
      };
    }

    return {
      title: isRetry ? "Enable Location Access" : "Share Your Location",
      description: isRetry
        ? "We need your location to show nearby restaurants and personalized recommendations."
        : "Get personalized restaurant recommendations and see what's available near you.",
      content: (
        <div className="space-y-6">
          {/* Benefits */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  Find nearby restaurants
                </p>
                <p className="text-gray-600">
                  Discover food options close to you
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  Personalized recommendations
                </p>
                <p className="text-gray-600">
                  Get suggestions based on your location
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isRequesting ? "Requesting..." : "Allow Location Access"}
            </button>

            {onSkip && (
              <button
                onClick={onSkip}
                className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Privacy note */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 text-center">
              🔒 Your location is only used to show nearby options and is never
              shared with third parties
            </p>
          </div>
        </div>
      ),
    };
  };

  const content = getContent();

  useEffect(() => {
    // Reset instructions when modal reopens
    if (isOpen) {
      setShowInstructions(false);
    }
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-lg shadow-xl z-[101] m-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {content.title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-sm text-gray-600 mb-6">
              {content.description}
            </Dialog.Description>

            {content.content}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default LocationPermissionModal;
