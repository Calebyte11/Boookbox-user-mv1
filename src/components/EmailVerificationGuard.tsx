import React from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "@/store/authStore";

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  requireVerification?: boolean;
  showBanner?: boolean;
  redirectTo?: string;
}

/**
 * Component that guards routes and shows email verification warnings
 */
const EmailVerificationGuard: React.FC<EmailVerificationGuardProps> = ({
  children,
  requireVerification = false,
  showBanner = true,
  redirectTo = "/verify-email",
}) => {
  const { user, isAuthenticated } = useAuthStore();

  // Don't show anything if not authenticated
  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  // Redirect to verification page if verification is required and email is not verified
  if (requireVerification && !user.isVerified) {
    return <Navigate to={redirectTo} replace />;
  }

  // Show banner and children if verification is not required but email is not verified
  if (!user.isVerified && showBanner) {
    return <>{children}</>;
  }

  // Just show children if email is verified or no guards are needed
  return <>{children}</>;
};

export default EmailVerificationGuard;
