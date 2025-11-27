import React from "react";
import { Navigate } from "react-router-dom";
import EmailVerification from "@/features/auth/components/EmailVerification";
import useAuthStore from "@/store/authStore";

/**
 * Email verification page component
 * Redirects authenticated users with verified emails to dashboard
 */
const EmailVerificationPage: React.FC = () => {
  const { user } = useAuthStore();

  // Redirect to login if not authenticated
  // if (!isAuthenticated || !user) {
  //   return <Navigate to="/auth" replace />;
  // }

  // Redirect to dashboard if email is already verified
  if (user?.isVerified) {
    return <Navigate to="/" replace />;
  }

  return <EmailVerification email={user?.email} />;
};

export default EmailVerificationPage;
