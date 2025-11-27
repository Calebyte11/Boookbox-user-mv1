import React, { useEffect, useState, useCallback } from "react";
import { Bell, Download, Smartphone, X } from "lucide-react";
import Button from "./Button";
import { useNotifications } from "@/hooks/useNotifications";

// Define proper types for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const PWAInstallPrompt: React.FC = () => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Use notifications hook
  const {
    isSupported: isNotificationSupported,
    permission: notificationPermission,
    // isSubscribed: isNotificationSubscribed,
    enableNotifications,
  } = useNotifications();
  // Check if app is already installed
  const checkIfInstalled = useCallback(() => {
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isPWAInstalled = isStandalone || isIOSStandalone;

    // console.log("PWA Install Check:", {
    //   isStandalone,
    //   isIOSStandalone,
    //   isPWAInstalled,
    // });
    setIsInstalled(isPWAInstalled);

    // Check if we should show notification prompt after install
    if (
      isPWAInstalled &&
      isNotificationSupported &&
      notificationPermission === "default"
    ) {
      const dismissed = localStorage.getItem("notificationPromptDismissed");
      if (!dismissed) {
        setTimeout(() => setShowNotificationPrompt(true), 2000);
      }
    }

    return isPWAInstalled;
  }, [isNotificationSupported, notificationPermission]);

  useEffect(() => {
    // Early return if already installed
    if (checkIfInstalled()) {
      return;
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // console.log("beforeinstallprompt event fired", e);
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      // console.log("PWA was installed");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Add event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Service worker update handling
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // console.log("Service worker controller changed");
        if (updateAvailable) {
          window.location.reload();
        }
      });

      navigator.serviceWorker.ready
        .then((registration) => {
          // console.log("Service worker ready");

          registration.addEventListener("updatefound", () => {
            // console.log("Service worker update found");
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                // console.log("New service worker state:", newWorker.state);
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("New content available");
                  setUpdateAvailable(true);
                }
              });
            }
          });

          // Check for existing update
          if (registration.waiting) {
            // console.log("Service worker waiting");
            setUpdateAvailable(true);
          }
        })
        .catch((error) => {
          console.error("Service worker ready error:", error);
        });
    }

    // Debug: Check PWA criteria
    // console.log("PWA Debug Info:", {
    //   isHTTPS: location.protocol === "https:",
    //   hasServiceWorker: "serviceWorker" in navigator,
    //   hasManifest: document.querySelector('link[rel="manifest"]'),
    //   userAgent: navigator.userAgent,
    //   isStandalone: window.matchMedia("(display-mode: standalone)").matches,
    // });

    // Cleanup
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [checkIfInstalled, updateAvailable]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // console.log("No deferred prompt available");
      return;
    }

    try {
      // console.log("Showing install prompt");
      await deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;
      // console.log("User choice:", outcome);

      setDeferredPrompt(null);

      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  };

  const handleUpdateClick = () => {
    // console.log("Updating service worker");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
            }
            registration.update();
          });
        })
        .catch((error) => {
          console.error("Service worker update error:", error);
        });
    } // Small delay before reload to ensure message is sent
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Handle notification prompt
  const handleEnableNotifications = async () => {
    try {
      await enableNotifications();
      setShowNotificationPrompt(false);
    } catch (error) {
      console.error("Failed to enable notifications:", error);
    }
  };

  const handleDismissNotifications = () => {
    localStorage.setItem("notificationPromptDismissed", "true");
    setShowNotificationPrompt(false);
    setIsDismissed(true);
  };

  const handleDismissInstallPrompt = () => {
    setIsInstallable(false);
    setIsDismissed(true);
    setShowNotificationPrompt(false);
  };

  // Don't render if dismissed
  if (
    isDismissed ||
    localStorage.getItem("notificationPromptDismissed") === "true"
  ) {
    return null;
  }

  // Don't render if nothing to show
  if (
    !isInstallable &&
    !updateAvailable &&
    !showNotificationPrompt &&
    !isInstalled
  ) {
    return null;
  }

  return (
    <>
      {/* Main PWA Install/Update Prompt */}
      {(isInstallable || updateAvailable) && (
        <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg z-50 max-w-sm border border-gray-200">
          {/* Install Prompt */}
          {isInstallable && !isInstalled && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg text-gray-900">
                    Install BoookBox
                  </h3>
                </div>
                <button
                  onClick={handleDismissInstallPrompt}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mb-3 text-gray-600 text-sm">
                Install our app for a better experience with offline access!
              </p>
              <Button
                className="w-full bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
                handleClick={handleInstallClick}
              >
                <Smartphone className="w-4 h-4" />
                <span>Install App</span>
              </Button>
            </div>
          )}

          {/* Update Prompt */}
          {updateAvailable && (
            <div className="mb-3">
              <h3 className="font-bold text-lg mb-2 text-gray-900">
                Update Available
              </h3>
              <p className="mb-3 text-gray-600 text-sm">
                A new version of BoookBox is available!
              </p>
              <Button
                className="w-full bg-secondary text-white font-semibold py-2 px-4 rounded hover:bg-opacity-90 transition-colors"
                handleClick={handleUpdateClick}
              >
                Update Now
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notification Permission Prompt */}
      {showNotificationPrompt &&
        isInstalled &&
        isNotificationSupported &&
        notificationPermission === "default" && (
          <div className="fixed bottom-4 left-4 p-4 bg-white rounded-lg shadow-lg z-50 max-w-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Bell className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-bold text-lg text-gray-900">
                  Enable Notifications
                </h3>
              </div>
              <button
                onClick={handleDismissNotifications}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="mb-3 text-gray-600 text-sm">
              Stay updated with order notifications, new meal alerts, and
              important updates!
            </p>
            <div className="flex space-x-2">
              <Button
                className="flex-1 bg-primary text-white font-semibold py-2 px-4 rounded hover:bg-opacity-90 transition-colors flex items-center justify-center"
                handleClick={handleEnableNotifications}
              >
                <Bell className="w-4 h-4 mr-2 inline-block align-middle" />
                <span className="inline-block align-middle">Enable</span>
              </Button>
              <Button
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                handleClick={handleDismissNotifications}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        )}
    </>
  );
};

export default PWAInstallPrompt;
