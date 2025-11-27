/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { NotificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/useToast";
import useAuthStore from "@/store/authStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/services/notificationService";

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

// Hook for notification operations
export const useNotificationOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // const [lastNotificationCount, setLastNotificationCount] = useState(0);
  // const [hasInitialized, setHasInitialized] = useState(false);

  // Get all notifications
  const {
    data: notificationsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getAllNotifications(1, 50),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Get unread count
  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadCount,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto refetch every 30 seconds
  });

  // Check for new notifications and show push notifications
  // useEffect(() => {
  //   if (!notificationsData?.data || !hasInitialized) {
  //     if (notificationsData?.data) {
  //       setLastNotificationCount(notificationsData.data.length);
  //       setHasInitialized(true);
  //     }
  //     return;
  //   }

  //   // const currentCount = notificationsData.data.length;
  //   // const newNotificationsCount = currentCount - lastNotificationCount;

  //   // if (newNotificationsCount > 0) {
  //   //   // Get the newest notifications
  //   //   const newNotifications = notificationsData.data.slice(
  //   //     0,
  //   //     newNotificationsCount
  //   //   );

  //   //   // Show browser push notification for each new notification
  //   //   // newNotifications.forEach((notification: any) => {
  //   //   //   if ("Notification" in window && Notification.permission === "granted") {
  //   //   //     const browserNotification = new Notification(
  //   //   //       notification.title || "New BoookBox Notification",
  //   //   //       {
  //   //   //         body:
  //   //   //           notification.message ||
  //   //   //           notification.body ||
  //   //   //           "You have a new notification",
  //   //   //         icon: "/android-chrome-192x192.png",
  //   //   //         badge: "/android-chrome-192x192.png",
  //   //   //         tag: `notification-${notification.id}`,
  //   //   //         data: { notificationId: notification.id },
  //   //   //         requireInteraction: false,
  //   //   //       }
  //   //   //     );

  //   //   //     // Auto close after 5 seconds
  //   //   //     setTimeout(() => {
  //   //   //       browserNotification.close();
  //   //   //     }, 5000);

  //   //   //     // Handle click - navigate to notifications page
  //   //   //     browserNotification.onclick = () => {
  //   //   //       window.focus();
  //   //   //       window.location.href = "/notifications";
  //   //   //       browserNotification.close();
  //   //   //     };
  //   //   //   }

  //   //   //   // Also show toast notification
  //   //   //   // toast({
  //   //   //   //   title: notification.title || "New Notification",
  //   //   //   //   description:
  //   //   //   //     notification.message ||
  //   //   //   //     notification.body ||
  //   //   //   //     "You have a new notification",
  //   //   //   //   variant: "info",
  //   //   //   // });
  //   //   // });

  //   //   setLastNotificationCount(currentCount);
  //   // }
  // }, [notificationsData?.data, lastNotificationCount, hasInitialized, toast]);

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
    onError: (error: Error) => {
      console.log(error.message);
      // toast({
      //   title: "Error",
      //   description: error.message || "Failed to mark notification as read",
      //   variant: "error",
      // });
    },
  });
  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      // Remove toast - silent success for better UX
    },
    onError: (err) => {
      console.log(err);
      // toast({
      //   title: "Error",
      //   description:
      //     error.message || "Failed to mark all notifications as read",
      //   variant: "error",
      // });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
      toast({
        title: "Success",
        description: "Notification deleted",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "error",
      });
    },
  });

  return {
    notifications: notificationsData?.data || [],
    unreadCount: unreadCountData?.unreadCount || 0,
    isLoading,
    error,
    refetch,
    refetchUnreadCount,
    markRead: (id: string) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    deleteNotification: (id: string) => deleteNotificationMutation.mutate(id),
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
  };
};

export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newMeals: boolean;
  soundEnabled: boolean;
}

export interface NotificationHookReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  settings: NotificationSettings;
  requestPermission: () => Promise<void>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  showTestNotification: () => Promise<void>;
  fcmToken: string | null;
  subscription: PushSubscription | null;
}

export const useNotifications = (): NotificationHookReturn => {
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const toastRef = useRef(toast);

  // Update toastRef when toast changes
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // State
  const [isSupported] = useState(() => {
    // Only report as supported on platforms where we want push notifications
    return NotificationService.isNotificationSupported() && shouldEnablePushNotifications();
  });
  const [state, setState] = useState({
    permission: NotificationService.getPermissionStatus(),
    isSubscribed: false,
    isLoading: false,
    settings: NotificationService.getNotificationSettings(),
    fcmToken: null as string | null,
    subscription: null as PushSubscription | null,
  });

  // Combined state updater to reduce re-renders
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Initialize push notifications
   */
  const initializeNotifications = useCallback(async () => {
    if (!isSupported || !isAuthenticated || state.isLoading) return;
    
    // Double-check platform support before initializing
    if (!shouldEnablePushNotifications()) {
      console.log('Push notifications disabled for this platform (iOS or other)');
      return;
    }

    try {
      updateState({ isLoading: true });
      console.log("Initializing notifications...");

      const { subscription: newSubscription, fcmToken: newFcmToken } =
        await NotificationService.initialize();

      updateState({
        subscription: newSubscription || null,
        fcmToken: newFcmToken || null,
        isSubscribed: !!newSubscription,
        permission: NotificationService.getPermissionStatus(),
        isLoading: false,
      });

      if (newSubscription) {
        console.log("Notifications initialized successfully");
      }
    } catch (error) {
      console.error("Failed to initialize notifications:", error);
      toastRef.current({
        title: "Notification Setup Failed",
        description: "Unable to setup push notifications. Please try again.",
        variant: "error",
      });
      updateState({ isLoading: false });
    }
  }, [isSupported, isAuthenticated, state.isLoading, updateState]);

  /**
   * Initialize notifications when component mounts or user changes
   */
  useEffect(() => {
    if (
      isAuthenticated &&
      user &&
      state.settings.enabled &&
      !state.isSubscribed &&
      !state.isLoading
    ) {
      initializeNotifications();
    }
  }, [
    isAuthenticated,
    user,
    state.settings.enabled,
    state.isSubscribed,
    state.isLoading,
    initializeNotifications,
  ]);

  /**
   * Setup foreground message listener (stable reference)
   */
  useEffect(() => {
    if (!isSupported || !isAuthenticated) return;

    const handleMessage = (payload: any) => {
      console.log("Foreground message received:", payload);
      toastRef.current({
        title: payload.notification?.title || "New Notification",
        description: payload.notification?.body || "You have a new message",
        variant: "info",
      });

      if (document.hidden) {
        NotificationService.showNotification(
          payload.notification?.title || "BoookBox",
          {
            body: payload.notification?.body,
            icon: payload.notification?.icon || "/android-chrome-192x192.png",
            data: payload.data,
          }
        );
      }
    };

    const unsubscribe =
      NotificationService.setupForegroundListener(handleMessage);
    return unsubscribe;
  }, [isSupported, isAuthenticated]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    if (!isSupported || !shouldEnablePushNotifications()) {
      toastRef.current({
        title: "Not Supported",
        description: "Push notifications are not supported on this platform.",
        variant: "error",
      });
      return;
    }

    try {
      updateState({ isLoading: true });
      const newPermission = await NotificationService.requestPermission();
      updateState({ permission: newPermission, isLoading: false });

      if (newPermission === "granted") {
        toastRef.current({
          title: "Permission Granted",
          description: "You can now receive push notifications!",
          variant: "success",
        });
      } else {
        toastRef.current({
          title: "Permission Denied",
          description: "You won't receive push notifications.",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error requesting permission:", error);
      toastRef.current({
        title: "Permission Error",
        description: "Failed to request notification permission.",
        variant: "error",
      });
      updateState({ isLoading: false });
    }
  }, [isSupported, updateState]);

  /**
   * Enable notifications
   */
  const enableNotifications = useCallback(async () => {
    if (!isSupported || !isAuthenticated || state.isLoading) return;

    try {
      updateState({ isLoading: true });

      if (state.permission === "denied" || state.permission === "default") {
        await requestPermission();
        if (state.permission === "denied" || state.permission === "default") {
          updateState({ isLoading: false });
          return;
        }
      }

      const { subscription: newSubscription, fcmToken: newFcmToken } =
        await NotificationService.initialize();

      const newSettings = { ...state.settings, enabled: true };
      NotificationService.saveNotificationSettings(newSettings);

      updateState({
        settings: newSettings,
        subscription: newSubscription || null,
        fcmToken: newFcmToken || null,
        isSubscribed: !!newSubscription,
        isLoading: false,
      });

      toastRef.current({
        title: "Notifications Enabled",
        description:
          "You'll now receive push notifications for important updates!",
        variant: "success",
      });
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toastRef.current({
        title: "Enable Failed",
        description: "Failed to enable notifications. Please try again.",
        variant: "error",
      });
      updateState({ isLoading: false });
    }
  }, [
    isSupported,
    isAuthenticated,
    state.permission,
    state.settings,
    state.isLoading,
    requestPermission,
    updateState,
  ]);

  /**
   * Disable notifications
   */
  const disableNotifications = useCallback(async () => {
    if (state.isLoading) return;

    try {
      updateState({ isLoading: true });

      await NotificationService.unsubscribeFromPush();
      await NotificationService.deleteFCMToken();

      const newSettings = { ...state.settings, enabled: false };
      NotificationService.saveNotificationSettings(newSettings);

      updateState({
        settings: newSettings,
        subscription: null,
        fcmToken: null,
        isSubscribed: false,
        isLoading: false,
      });

      toastRef.current({
        title: "Notifications Disabled",
        description: "You won't receive push notifications anymore.",
        variant: "info",
      });
    } catch (error) {
      console.error("Error disabling notifications:", error);
      toastRef.current({
        title: "Disable Failed",
        description: "Failed to disable notifications completely.",
        variant: "error",
      });
      updateState({ isLoading: false });
    }
  }, [state.settings, state.isLoading, updateState]);

  /**
   * Update notification settings
   */
  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      const updatedSettings = { ...state.settings, ...newSettings };
      NotificationService.saveNotificationSettings(updatedSettings);
      updateState({ settings: updatedSettings });
    },
    [state.settings, updateState]
  );

  /**
   * Show test notification
   */
  const showTestNotification = useCallback(async () => {
    if (!isSupported || state.permission !== "granted") {
      toastRef.current({
        title: "Cannot Show Test",
        description: "Notifications are not enabled or permission not granted.",
        variant: "warning",
      });
      return;
    }

    try {
      await NotificationService.showNotification(
        "👋 Welcome Back to BoookBox!",
        {
          body: "We missed you! Tap to see today's special meals near you.",
          icon: "/android-chrome-192x192.png",
          badge: "/android-chrome-192x192.png",
          tag: "test-notification",
          data: { test: true },
        }
      );
    } catch (error) {
      console.error("Error showing test notification:", error);
      toastRef.current({
        title: "Test Failed",
        description: "Failed to show test notification.",
        variant: "error",
      });
    }
  }, [isSupported, state.permission]);

  return {
    // Status
    isSupported,
    permission: state.permission,
    isSubscribed: state.isSubscribed,
    isLoading: state.isLoading,

    // Settings
    settings: state.settings,

    // Actions
    requestPermission,
    enableNotifications,
    disableNotifications,
    updateSettings,
    showTestNotification,

    // Data
    fcmToken: state.fcmToken,
    subscription: state.subscription,
  };
};

export default useNotifications;
