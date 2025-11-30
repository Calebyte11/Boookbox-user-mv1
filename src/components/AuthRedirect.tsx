import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { useAuth } from "@/features/auth/hooks";

interface AuthRedirectProps {
  children: React.ReactNode;
}

/**
 * Middleware component to redirect authenticated users away from public routes (e.g., login/signup)
 * Usage: Wrap your public page content with <AuthRedirect>...</AuthRedirect>
 */
const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, isLoggingOut } = useAuthStore();
  const { isInitialized } = useAuth();
  const EMAIL_VERIFICATION_PATH = "/auth/email-verification";
  const isEmailVerification = pathname === EMAIL_VERIFICATION_PATH;

  useEffect(() => {
    // Only redirect if auth is initialized AND authenticated AND not logging out
    if (isInitialized && isAuthenticated && !isLoggingOut && !isEmailVerification) {
      // navigate("/home", { replace: true });
    }
  }, [isAuthenticated, isLoggingOut, isEmailVerification, navigate, isInitialized]);

  // Show loading during initialization or render children if not authenticated or logging out
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only render children if not authenticated OR if logging out
  return <>{(!isAuthenticated || isLoggingOut) && children}</>;
};

export default AuthRedirect;
