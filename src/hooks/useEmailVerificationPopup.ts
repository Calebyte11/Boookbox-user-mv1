import { useState, useEffect, useCallback } from "react";
import useAuthStore from "@/store/authStore";
import { usersService } from "@/services/usersService";

interface UseEmailVerificationPopupOptions {
  /** Delay in milliseconds before showing the popup (default: 2 minutes) */
  delayMs?: number;
  /** Key for localStorage to remember if user dismissed */
  storageKey?: string;
  /** How long to wait before showing again after dismissal (default: 24 hours) */
  dismissalCooldownMs?: number;
}

/**
 * Hook to manage email verification popup state and timing
 */
export const useEmailVerificationPopup = ({
  delayMs = 2 * 60 * 1000, // 2 minutes
  storageKey = "email-verification-popup-dismissed",
  dismissalCooldownMs = 24 * 60 * 60 * 1000, // 24 hours
}: UseEmailVerificationPopupOptions = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);
  const { user, updateUser } = useAuthStore();

  // Check current user verification status from API
  const checkVerificationStatus = useCallback(async () => {
    if (!user || user.isVerified) return;

    try {
      const response = (await usersService.getUserProfile()) as {
        isVerified?: boolean;
      };

      if (response.isVerified || user.isVerified) {
        updateUser({ isVerified: true });
        setIsOpen(false);
      }
    } catch (error) {
      console.log(error);
      // Silently fail - don't show errors for this background check
    }
  }, [user, updateUser]);
  // Check if popup should be shown
  const shouldShow = useCallback(() => {
    // Don't show if user is not authenticated or already verified
    if (!user || user.isVerified) return false;

    // Check if user dismissed it recently
    const dismissedAt = localStorage.getItem(storageKey);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < dismissalCooldownMs) {
        return false;
      }
    }

    return true;
  }, [user, storageKey, dismissalCooldownMs]);

  // Auto-show popup after delay
  useEffect(() => {
    if (hasShownOnce || !shouldShow()) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasShownOnce(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [shouldShow, delayMs, hasShownOnce]);

  // Close popup when user becomes verified
  useEffect(() => {
    if (user?.isVerified && isOpen) {
      setIsOpen(false);
    }
  }, [user?.isVerified, isOpen]);

  // Periodically check verification status when popup is open
  useEffect(() => {
    if (!isOpen || user?.isVerified) return;

    // Check immediately when popup opens
    checkVerificationStatus();

    // Then check every 10 seconds while popup is open
    const interval = setInterval(checkVerificationStatus, 10000);

    return () => clearInterval(interval);
  }, [isOpen, user?.isVerified, checkVerificationStatus]);

  const openPopup = () => {
    if (shouldShow()) {
      setIsOpen(true);
    }
  };

  const closePopup = () => {
    setIsOpen(false);
  };

  const dismissPopup = () => {
    setIsOpen(false);
    // Remember dismissal time
    localStorage.setItem(storageKey, Date.now().toString());
  };
  return {
    isOpen,
    openPopup,
    closePopup,
    dismissPopup,
    shouldShow: shouldShow(),
    user,
  };
};

export default useEmailVerificationPopup;
