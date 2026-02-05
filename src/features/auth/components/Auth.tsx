import React from "react";
import AuthPage from "@/features/auth/components/AuthPage";
import { useNavigate} from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { useAuth } from "@/features/auth/hooks";

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoggingOut } = useAuthStore();
  const { isInitialized, isLoading } = useAuth();
  // const restaurant_url = import.meta.env.VITE_APP_RESTAURANT;

  React.useEffect(() => {
    // Only redirect after auth has been initialized
    if (isInitialized && isAuthenticated && user && !isLoggingOut) {
      // For iOS PWA, add a small delay to ensure loading fallback is hidden first
      const isIOSPWA = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
                       'standalone' in navigator && 
                       (navigator as unknown as { standalone?: boolean }).standalone === true;
      
      if (isIOSPWA) {
        // Small delay for iOS PWA to prevent white screen
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 100);
      } else {
        navigate("/home", { replace: true });
      }
    }
  }, [isAuthenticated, user, isLoggingOut, navigate, isInitialized]);

  // Show loading spinner while auth is being initialized or during authenticated redirect
  if (!isInitialized || isLoading || (isAuthenticated && user && !isLoggingOut)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
          <p className="text-gray-600">
            {!isInitialized ? "Initializing..." : 
             isAuthenticated ? "Redirecting to home..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (

    <AuthPage />
  );
};

export default Auth;
