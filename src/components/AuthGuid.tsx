import { useEffect } from "react";
import useAuthStore from "@/store/authStore";
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user, forceLogout, hasValidAuth } = useAuthStore();

  useEffect(() => {
    // Handle authentication events
    const handleAuthEvents = () => {
      // Listen for logout events
      const handleLogout = () => {
        // Clear everything and redirect
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 100);
      };

      // Listen for session expiry
      const handleSessionExpired = () => {
        forceLogout();
        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 100);
      };

      // Handle page visibility change (when user comes back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden && isAuthenticated && user) {
          // User came back to the tab, validate auth
          if (user.token && !hasValidAuth()) {
            console.log("🔒 Session expired while away, logging out");
            forceLogout();
          }
        }
      };

      // Handle storage changes (logout from another tab)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "users-auth-storage" && e.newValue === null) {
          // Auth was cleared in another tab, logout here too
          forceLogout();
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 100);
        }
      };

      // Add event listeners
      window.addEventListener("auth:logout", handleLogout);
      window.addEventListener("auth:sessionExpired", handleSessionExpired);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener("auth:logout", handleLogout);
        window.removeEventListener("auth:sessionExpired", handleSessionExpired);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("storage", handleStorageChange);
      };
    };

    return handleAuthEvents();
  }, [isAuthenticated, user, forceLogout, hasValidAuth]);

  // Prevent right-click and developer tools in production
  useEffect(() => {
    if (import.meta.env.PROD) {
      const preventContextMenu = (e: Event) => e.preventDefault();
      const preventDevTools = (e: KeyboardEvent) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && e.key === "I") ||
          (e.ctrlKey && e.shiftKey && e.key === "C") ||
          (e.ctrlKey && e.shiftKey && e.key === "J") ||
          (e.ctrlKey && e.key === "U")
        ) {
          e.preventDefault();
        }
      };

      document.addEventListener("contextmenu", preventContextMenu);
      document.addEventListener("keydown", preventDevTools);

      return () => {
        document.removeEventListener("contextmenu", preventContextMenu);
        document.removeEventListener("keydown", preventDevTools);
      };
    }
  }, []);

  return <>{children}</>;
};
