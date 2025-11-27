import AppRoutes from "@/config/routes";
// import SEO from "@/components/SEO";
import LocationErrorBoundary from "@/components/LocationErrorBoundary";
import { ToastProvider } from "@/hooks/useToast";
import PWAPaymentBridge from "@/components/PWAPaymentBridge";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import React, { lazy, Suspense } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { preloadLocation, isIOSDevice } from "@/utils/iosLocationFix";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import "./App.css";

const PaymentStateManager = lazy(
  () => import("@/components/PaymentStateManager")
);
const ServiceWorkerRegistration = lazy(
  () => import("@/components/ServiceWorkerRegistration")
);

function isAndroidDevice() {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

function isWindowsDesktop() {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') return false;
  return (
    /windows/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent)
  );
}

function shouldShowPWAPrompt() {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false;
  // Only show PWA install prompt for Android devices and Windows desktop
  return isAndroidDevice() || isWindowsDesktop();
}

function App() {
  // Enable scroll restoration for better UX across all pages, except Home page internal navigation
  // Exclude /home paths to allow Home page to handle its own scroll behavior for tab switching
  useScrollToTop("root", ["/home"]);
  
  React.useEffect(() => {
    // Add global error handler for notification-related errors
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event.message.includes("Notification") ||
        event.message.includes("PushSubscription")
      ) {
        console.warn(
          "Notification-related error caught and ignored:",
          event.message
        );
        event.preventDefault();
        return false;
      }
    };

    // Add unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason &&
        typeof reason === "object" &&
        reason.toString().includes("Notification")
      ) {
        console.warn(
          "Notification-related promise rejection caught and ignored:",
          reason
        );
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Prevent notification-related errors on iOS by ensuring global variables exist
    if (typeof window !== "undefined") {
      // Add a safe fallback for Notification if it doesn't exist (iOS Safari issue)
      if (!("Notification" in window)) {
        // Create a mock Notification object to prevent "Can't find variable" errors
        Object.defineProperty(window, "Notification", {
          value: {
            permission: "denied",
            requestPermission: () => Promise.resolve("denied"),
          },
          writable: false,
          configurable: false,
        });
        console.log("Added Notification fallback for iOS");
      }
    }

    // Additional safety to hide loading fallback
    const timer = setTimeout(() => {
      document.body.classList.add("app-loaded");
    }, 2000);

    // For iOS PWAs, completely disable location preloading to prevent white screens
    if (isIOSDevice()) {
      // console.log('iOS device detected');

      // Check if in PWA mode (with proper typing)
      const isPWA =
        "standalone" in navigator &&
        (navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isPWA) {
        console.log(
          "iOS PWA mode - skipping location preload to prevent white screen"
        );
        // Don't preload location for iOS PWAs - let components handle it on-demand

        // Ensure app is marked as loaded faster for iOS PWA
        setTimeout(() => {
          document.body.classList.add("app-loaded");
          console.log("iOS PWA marked as loaded early");
        }, 1500);
      } else {
        // For iOS Safari, use longer delay
        setTimeout(() => {
          console.log("Preloading location for iOS Safari after delay");
          preloadLocation().catch((err) => {
            console.error("Location preload failed:", err);
          });
        }, 8000);
      }
    } else {
      // Preload location services for non-iOS devices with error handling
      setTimeout(() => {
        preloadLocation().catch((err) => {
          console.error("Location preload failed:", err);
        });
      }, 1000);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <LocationErrorBoundary>
      <ToastProvider>
        <Theme appearance="light">
          {/* <SEO
          description="BoookBox - Social-impact platform connecting meal sponsors with recipients"
          keywords="boookbox, food donation, charity, food sharing, community support, meals"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "BoookBox",
            description: "Social-impact platform connecting meal sponsors with recipients",
            url: typeof window !== "undefined" ? window.location.origin : "",
          }}
          /> */}
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <ServiceWorkerRegistration />
            </Suspense>
          </ClientOnly>
          <ClientOnly fallback={null}>
            <Suspense fallback={null}>
              <PaymentStateManager />
            </Suspense>
          </ClientOnly>
          <PWAPaymentBridge />
          <AppRoutes />
          {shouldShowPWAPrompt() && <PWAInstallPrompt />}
        </Theme>
      </ToastProvider>
    </LocationErrorBoundary>
  );
}

export default App;