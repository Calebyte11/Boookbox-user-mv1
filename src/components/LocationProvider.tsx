import React from "react";
import { useLocationService } from "@/hooks/useLocationService";
import LocationPermissionModal from "@/components/LocationPermissionModal";

interface LocationProviderProps {
  children: React.ReactNode;
  autoRequest?: boolean;
  enableWatching?: boolean;
  showToasts?: boolean;
}

const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
  autoRequest = true,
  // enableWatching = false,
  // showToasts = true,
}) => {
  const {
    showPermissionModal,
    setShowPermissionModal,
    permissionStatus,
    getCurrentLocation,
    hasLocation,
  } = useLocationService({
    autoRequest,
    // enableWatching,
    // showToasts,
  });

  const handleRequestPermission = async () => {
    return await getCurrentLocation();
  };

  const handleSkip = () => {
    setShowPermissionModal(false);
  };
  return (
    <>
      {children}
      {/* Only show permission modal if we don't have any location (GPS or IP) */}
      <LocationPermissionModal
        isOpen={showPermissionModal && !hasLocation }
        onClose={() => setShowPermissionModal(false)}
        onRequestPermission={handleRequestPermission}
        onSkip={handleSkip}
        permissionStatus={permissionStatus}
        isRetry={permissionStatus === "denied"}
      />
    </>
  );
};

export default LocationProvider;
