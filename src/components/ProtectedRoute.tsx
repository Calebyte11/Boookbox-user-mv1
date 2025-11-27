import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks";
import useAuthStore from "@/store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectUnauthorizedTo?: string;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const { isLoggingOut } = useAuthStore();
  const location = useLocation();

  // Show loading indicator while auth is initializing, loading, or during logout
  if (!isInitialized || isLoading || isLoggingOut) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <div className="flex flex-col items-center">
          <div className="text-3xl font-extrabold tracking-tight mb-4 font-inter text-primary">BOOOKBOX 4.0</div>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
      </div>
      </div>
    );
  }

  // Only redirect if auth is initialized and user is not authenticated
  if (isInitialized && !isAuthenticated && !isLoggingOut) {
    return (
      <Navigate
        to="/auth/login"
        state={{ from: location, message: "Please sign in to continue" }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
