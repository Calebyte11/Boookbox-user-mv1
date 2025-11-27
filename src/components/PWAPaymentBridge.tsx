/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

/**
 * PWA Payment Bridge - Handles PWA-specific payment challenges
 * This component should be included in your main App component
 */
const PWAPaymentBridge = () => {
  useEffect(() => {
    // Listen for app visibility changes (when user returns from payment)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // console.log(
        //   "🔄 App became visible - user may have returned from payment"
        // );

        // Check URL for payment return parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasPaymentParams = !!(
          urlParams.get("status") ||
          urlParams.get("tx_ref") ||
          urlParams.get("reference") ||
          urlParams.get("payment")
        );

        if (hasPaymentParams) {
          // console.log("💳 Payment return parameters detected");

          // Trigger a custom event that our payment handler can listen for
          window.dispatchEvent(
            new CustomEvent("paymentReturn", {
              detail: {
                params: Object.fromEntries(urlParams.entries()),
                timestamp: Date.now(),
              },
            })
          );
        }
      }
    };

    // Listen for page focus (when user returns to tab/app)
    const handleFocus = () => {
      // console.log("🎯 App received focus - checking for payment status");

      // Small delay to ensure URL has been updated
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasPaymentParams = !!(
          urlParams.get("status") ||
          urlParams.get("tx_ref") ||
          urlParams.get("reference") ||
          urlParams.get("payment")
        );

        if (hasPaymentParams) {
          window.dispatchEvent(
            new CustomEvent("paymentReturn", {
              detail: {
                params: Object.fromEntries(urlParams.entries()),
                timestamp: Date.now(),
              },
            })
          );
        }
      }, 500);
    };

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    // Handle browser back/forward navigation
    const handlePopState = (event: PopStateEvent) => {
      console.log("🔙 Navigation detected:", event.state);

      // Check if we're returning to a payment-related page
      const urlParams = new URLSearchParams(window.location.search);
      const hasPaymentParams = !!(
        urlParams.get("status") ||
        urlParams.get("tx_ref") ||
        urlParams.get("reference") ||
        urlParams.get("payment")
      );

      if (hasPaymentParams) {
        // console.log("💳 Payment parameters detected in navigation");
        window.dispatchEvent(
          new CustomEvent("paymentReturn", {
            detail: {
              params: Object.fromEntries(urlParams.entries()),
              timestamp: Date.now(),
              source: "navigation",
            },
          })
        );
      }
    };

    window.addEventListener("popstate", handlePopState);

    // PWA-specific: Handle app install state changes
    let deferredPrompt: any = null;

    const handleBeforeInstallPrompt = (e: Event) => {
      deferredPrompt = e;
      // Prevent the default prompt
      e.preventDefault();
      if (!deferredPrompt) {
        // console.warn("No deferred prompt available");
        return;
      }
    };

    const handleAppInstalled = () => {
      // console.log(
      //   "📱 PWA installed - payment handling may need to be refreshed"
      // );
      deferredPrompt = null;
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Service Worker: Listen for payment-related messages
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "PAYMENT_RETURN") {
          console.log(
            "📡 Payment return message from Service Worker:",
            event.data
          );

          window.dispatchEvent(
            new CustomEvent("paymentReturn", {
              detail: {
                params: event.data.params,
                timestamp: Date.now(),
                source: "serviceWorker",
              },
            })
          );
        }
      });
    }

    // Cleanup function
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default PWAPaymentBridge;
