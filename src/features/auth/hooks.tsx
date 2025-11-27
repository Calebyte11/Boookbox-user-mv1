import { useState, useEffect } from "react";
import useAuthStore from "@/store/authStore";
import AuthService from "@/features/auth/services/authService";
import { useNotifications } from "@/hooks/useNotifications";

/**
 * Custom hook for authentication management
 * @returns Authentication utilities and state
 */
const useAuth = () => {
  const {
    user,
    isAuthenticated,
    loading: storeLoading,
    error: storeError,
    isInitialized,
    login,
    logout,
    forceLogout,
    isTokenValid,
    refreshTokenIfNeeded,
    setInitialized,
  } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(storeError);

  // Initialize push notifications for authenticated users
  const notifications = useNotifications();

  // Initialize authentication state
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      setIsLoading(true);
      
      // Mark as not initialized at start
      setInitialized(false);
      
      const state = useAuthStore.getState();

      if (state.user && state.isAuthenticated) {
        // For users with tokens (API users), validate token first
        if (state.user.token) {
          const isValid = state.isTokenValid();
          if (!isValid) {
            // Token is invalid or expired, force logout
            forceLogout();
          } else {
            // Optional: Refresh token if needed
            try {
              await refreshTokenIfNeeded();
            } catch (tokenError) {
              console.error("Auth: Token refresh failed:", tokenError);
              forceLogout();
            }
          }
        }
        // For social media users without tokens, they're considered valid if authenticated
      } else {
        // Listen to Firebase auth state changes (for Google/Facebook only)
        unsubscribe = AuthService.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // User is signed in with Firebase, get user data from Firestore
            const userData = await AuthService.getUserData(firebaseUser.uid);
            if (userData) {
              login(userData);
            }
          }
        });
      }

      // Mark auth as initialized and loading complete
      setInitialized(true);
      setIsLoading(false);
    };

    // Only initialize if not already initialized
    if (!isInitialized) {
      initializeAuth();
    } else {
      // If already initialized, just sync the loading state
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [login, logout, forceLogout, refreshTokenIfNeeded, isInitialized, setInitialized]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Sign in with email and password
   */
  const signInWithEmail = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Pass rememberMe to AuthService
      const { user } = await AuthService.signIn(email, password, rememberMe);

      login(user);

      setTimeout(async () => {
        try {
          if (
            notifications.isSupported &&
            notifications.permission === "granted"
          ) {
            await notifications.showTestNotification();
          } else {
            console.log(
              "Notifications not supported or permission not granted"
            );
          }
        } catch (notificationError) {
          console.error("Failed to send test notification:", notificationError);
        }
      }, 2000); // Wait 2 seconds after sign-in to send test notification

      return user;
    } catch (err) {
      console.error("useAuth: Sign in error", err);
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with Google
   */
  const signInWithGoogle = async (rememberMe: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Pass rememberMe to AuthService
      const { user } = await AuthService.signInWithGoogle(rememberMe);
      login(user);

      // Test push notification after successful Google sign-in
      setTimeout(async () => {
        try {
          if (
            notifications.isSupported &&
            notifications.permission === "granted"
          ) {
            await notifications.showTestNotification();
          }
        } catch (notificationError) {
          console.error("Failed to send test notification:", notificationError);
        }
      }, 2000);

      return user;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Google sign in failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    // Prevent multiple sign-out calls
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1. Sign out from Firebase if the current user is a Firebase user
      const currentFirebaseUser = AuthService.getCurrentUser();
      if (currentFirebaseUser && user?.id === currentFirebaseUser.uid) {
        await AuthService.signOut();
      }

      // 2. Call logout from store to clear all state and storage
      await logout();

      // 3. Force redirect to login page
      window.location.replace("/auth/login");
    } catch (err) {
      console.error("useAuth: Sign-out failed", err);
      const errorMessage =
        err instanceof Error ? err.message : "Sign out failed";
      setError(errorMessage);

      // As a fallback, attempt to clear state again and force redirect
      try {
        await logout();
      } catch (logoutError) {
        console.error("useAuth: Emergency logout failed:", logoutError);
      } finally {
        window.location.replace("/auth/login");
      }
    }
  };

  /**
   * Force logout - for immediate state clearing when navigating to auth pages
   * This prevents race conditions during navigation
   */
  const forceSignOut = () => {
    console.log("useAuth: Force sign-out initiated");

    try {
      // Sign out from Firebase if the current user is a Firebase user
      const currentFirebaseUser = AuthService.getCurrentUser();
      if (currentFirebaseUser && user?.id === currentFirebaseUser.uid) {
        AuthService.signOut().catch(console.error);
      }

      // Immediately clear auth state
      forceLogout();
    } catch (err) {
      console.error("useAuth: Force sign-out failed", err);
      // Even if there's an error, force clear the state
      forceLogout();
    }
  };

  /**
   * Validate current authentication state
   */
  const validateAuth = async (): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      return false;
    }

    // For users with tokens, validate the token
    if (user.token) {
      try {
        const isValid = isTokenValid();
        if (!isValid) {
          forceSignOut();
          return false;
        }
        return true;
      } catch (error) {
        console.error("Auth validation failed:", error);
        forceSignOut();
        return false;
      }
    }

    // For social media users without tokens, they're valid if authenticated
    return true;
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || storeLoading,
    isInitialized,
    error,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    forceSignOut,
    clearError: () => setError(null),
    isTokenValid,
    refreshTokenIfNeeded,
    validateAuth,
  };
};

export { useAuth };