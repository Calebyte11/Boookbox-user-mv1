import { useEffect, useRef } from "react";
import { useNotificationOperations } from "@/hooks/useNotifications";

// Helper functions to detect device types
function isAndroidDevice() {
  return /android/i.test(navigator.userAgent);
}

function isWindowsDesktop() {
  return /windows/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
}

function shouldEnablePushNotifications() {
  // Only enable push notifications for Android devices and Windows desktop
  // This prevents issues on iOS and other platforms
  return isAndroidDevice() || isWindowsDesktop();
}

const AutoPushNotification = () => {
  const { notifications } = useNotificationOperations();
  const lastNotifId = useRef<string | null>(null);

  useEffect(() => {
    // Early return if push notifications are not supported on this platform
    if (!shouldEnablePushNotifications()) {
      console.log('Push notifications disabled for this platform (iOS or other)');
      return;
    }

    // Additional check for Notification API availability
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Notification API not available');
      return;
    }

    if (
      notifications.length > 0 &&
      notifications[0].id !== lastNotifId.current &&
      Notification.permission === "granted"
    ) {
      const notif = notifications[0];
      // Only send notification if createdAt is within last 5 minutes and isRead is false
      if (notif.isRead) {
        return;
      }
      const now = Date.now();
      const createdAt =
        typeof notif.createdAt === "string"
          ? new Date(notif.createdAt).getTime()
          : typeof notif.createdAt === "number"
          ? notif.createdAt
          : 0;
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (!createdAt || now - createdAt > FIVE_MINUTES) {
        return;
      }
      try {
        const notificationData = {
          notificationId: notif.id,
          action: notif.action || "/notifications",
        };
        const iconUrl = notif.image || "/android-chrome-192x192.png";
        if ("serviceWorker" in navigator && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(notif.title || "New Notification", {
              body: notif.message || "You have a new notification",
              icon: iconUrl,
              badge: "/ios/72.png",
              tag: `notification-${notif.id}`,
              data: notificationData,
            });
          });
        } else {
          const browserNotification = new Notification(
            notif.title || "New Notification",
            {
              body: notif.message || "You have a new notification",
              icon: iconUrl,
              badge: "/ios/72.png",
              tag: `notification-${notif.id}`,
              data: notificationData,
            }
          );
          browserNotification.onclick = () => {
            window.focus();
            window.location.href = notif.action || "/notifications";
            browserNotification.close();
          };
        }
        lastNotifId.current = notif.id;
      } catch (err) {
        // Prevent crash, optionally log error
        console.error("Notification error:", err);
      }
    }
  }, [notifications]);

  
  return <></>;
};

export default AutoPushNotification;
