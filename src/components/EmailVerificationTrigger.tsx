import React from "react";
import { Bell } from "lucide-react";
import { useEmailVerificationPopup } from "@/hooks/useEmailVerificationPopup";
import useAuthStore from "@/store/authStore";

/**
 * A small trigger button to manually open the email verification popup
 * Can be used in navigation, header, or anywhere else
 */
const EmailVerificationTrigger: React.FC = () => {
  const { openPopup, shouldShow } = useEmailVerificationPopup();
  const { user } = useAuthStore();

  // Don't show if user is verified or not authenticated
  if (!user || user.isVerified || !shouldShow) {
    return null;
  }

  return (
    <button
      onClick={openPopup}
      className="relative inline-flex items-center justify-center p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full transition-colors"
      title="Verify your email address"
    >
      <Bell className="h-5 w-5" />
      <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full animate-pulse" />
      <span className="sr-only">Verify email address</span>
    </button>
  );
};

export default EmailVerificationTrigger;
