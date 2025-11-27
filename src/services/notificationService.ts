/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
  deleteToken,
} from "firebase/messaging";
import { app } from "@/firebase";
import { apiClient } from "@/services/apiClient";
import { API_ENDPOINTS, getUserEndpoint } from "@/config/endpoints";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// API Types
export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "booking"
    | "payment"
    | "reminder";
  isRead: boolean;
  data?: Record<string, any>; // Additional data like booking ID, restaurant ID, etc.
  createdAt: string;
  updatedAt: string;
  notificationId?: string;
  action:string;
}

export interface NotificationsResponse {
  success: boolean;
  data: NotificationItem[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface NotificationCountResponse {
  success: boolean;
  count: number;
}

export interface MarkReadResponse {
  success: boolean;
  message: string;
}

type NotificationPreferences = {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newMeals: boolean;
  soundEnabled: boolean;
};

interface NotificationInitResult {
  subscription?: PushSubscription;
  fcmToken?: string;
}

/**
 * Notification Service for managing FCM tokens and push notifications
 * Handles Firebase Cloud Messaging token lifecycle and notification preferences
 */
export class NotificationService {
  /**
   * Initialize notification service with user preferences
   * @returns Object containing subscription and FCM token if successful
   */
  static async initialize(): Promise<NotificationInitResult> {
    // Early platform check
    if (!this.isNotificationSupported()) {
      console.log("Notifications not supported on this platform");
      return {};
    }

    const settings = this.getNotificationSettings();

    if (!settings.enabled) {
      console.log("Notifications are disabled in user preferences");
      return {};
    }

    const permission = await this.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted");
      return {};
    }

    const isPushSupported = await this.isPushSupported();
    if (!isPushSupported) {
      console.log("Push notifications are not supported");
      return {};
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await this.subscribeToPush(registration);
      const fcmToken = await this.getFCMToken(registration);

      return { subscription, fcmToken };
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      return {};
    }
  }
  /**
   * Check if push notifications are supported in the current environment
   * @returns Promise resolving to true if supported
   */
  static async isPushSupported(): Promise<boolean> {
    try {
      return (
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        (await isSupported())
      );
    } catch (error) {
      console.error("Error checking push support:", error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   * @param registration Service worker registration
   * @returns Promise resolving to PushSubscription if successful
   */
  static async subscribeToPush(
    registration: ServiceWorkerRegistration
  ): Promise<PushSubscription | undefined> {
    try {
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        // console.log("Using existing push subscription");
        return existingSub;
      }

      if (!VAPID_KEY) {
        console.error("VAPID key is not configured");
        return undefined;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_KEY,
      });

      console.log("Successfully subscribed to push notifications");
      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      return undefined;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribeFromPush(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log("Successfully unsubscribed from push notifications");
      } else {
        console.log("No active push subscription found");
      }
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
    }
  }

  static async getFCMToken(
    registration: ServiceWorkerRegistration
  ): Promise<string | undefined> {
    try {
      const messaging = getMessaging(app);
      return await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
    } catch (err) {
      console.error("FCM token error:", err);
      return undefined;
    }
  }
  static async deleteFCMToken(): Promise<void> {
    try {
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      });

      if (currentToken) {
        // Delete the current token using the imported deleteToken function
        await deleteToken(messaging);
        console.log("FCM token deleted successfully");
      } else {
        console.log("No FCM token to delete");
      }
    } catch (error) {
      console.error("Error deleting FCM token:", error);
    }
  }
  /**
   * Setup foreground message listener for FCM
   * @param callback Function to handle incoming messages
   * @returns Unsubscribe function
   */
  static setupForegroundListener(callback: (payload: any) => void): () => void {
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, callback);
    return unsubscribe;
  }

  /**
   * Show a notification using the browser's notification API
   * @param title Notification title
   * @param options Notification options
   */
  static showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    }
  }

  /**
   * Check if notifications are supported in the current environment
   * @returns true if notifications are supported
   */
  static isNotificationSupported(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    // Platform detection
    const isAndroid = /android/i.test(navigator.userAgent);
    const isWindowsDesktop = /windows/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Only support push notifications on Android and Windows Desktop
    const isPlatformSupported = isAndroid || isWindowsDesktop;
    
    // Basic browser support check
    const hasBrowserSupport = typeof window !== 'undefined' && 
                             "Notification" in window && 
                             "serviceWorker" in navigator;
    
    if (isIOS) {
      console.log('Push notifications disabled on iOS platform');
      return false;
    }
    
    return isPlatformSupported && hasBrowserSupport;
  }

  /**
   * Get current notification permission status
   * @returns Current permission status
   */
  static getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from the user
   * @returns Promise resolving to the permission status
   */
  static async requestPermission(): Promise<NotificationPermission> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        console.log('Notification API not available');
        return 'denied';
      }
      
      if (!this.isNotificationSupported()) {
        console.log('Platform does not support push notifications');
        return 'denied';
      }
      
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  }

  /**
   * Save notification settings to localStorage
   * @param settings Notification preferences to save
   */
  static saveNotificationSettings(settings: NotificationPreferences): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem("notificationPreferences", JSON.stringify(settings));
    }
  }

  /**
   * Get notification settings from localStorage
   * @returns Current notification preferences
   */
  static getNotificationSettings(): NotificationPreferences {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        orderUpdates: true,
        promotions: false,
        newMeals: true,
        soundEnabled: true,
      };
    }
    const data = localStorage.getItem("notificationPreferences");
    return data
      ? JSON.parse(data)
      : {
          enabled: false,
          orderUpdates: true,
          promotions: false,
          newMeals: true,
          soundEnabled: true,
        };
  }
}

// API Functions for notification endpoints

// Get all notifications
export const getAllNotifications = async (
  page: number = 1,
  limit: number = 20
): Promise<any> => {
  try {
    const endpoint = `${API_ENDPOINTS.NOTIFICATIONS.GET_ALL}?page=${page}&limit=${limit}`;
    const response = await apiClient.get<any>(endpoint);
    return response || { success: false, data: [] };
  } catch (error: any) {
    console.error("Failed to get notifications:", error);
    throw new Error(
      error.response?.data?.message || "Failed to get notifications"
    );
  }
};

// Get unread notification count
export const getUnreadCount = async (): Promise<any> => {
  try {
    const endpoint = API_ENDPOINTS.NOTIFICATIONS.GET_UNREAD_COUNT;
    const response = await apiClient.get<any>(endpoint);
    return response || { success: false, unreadCount: 0 };
  } catch (error: any) {
    console.error("Failed to get unread count:", error);
    throw new Error(
      error.response?.data?.message || "Failed to get unread count"
    );
  }
};

// Mark notification as read
export const markAsRead = async (notificationId: string): Promise<any> => {
  try {
    const endpoint = getUserEndpoint.markNotificationRead(notificationId);
    const response = await apiClient.patch<any>(endpoint);
    return response || { success: false, message: "Failed to mark as read" };
  } catch (error: any) {
    console.error("Failed to mark notification as read:", error);
    throw new Error(
      error.response?.data?.message || "Failed to mark notification as read"
    );
  }
};

// Mark all notifications as read
export const markAllAsRead = async (): Promise<any> => {
  try {
    const endpoint = getUserEndpoint.markAllNotificationsRead();
    const response = await apiClient.patch(endpoint);
    return (
      response || { success: false, message: "Failed to mark all as read" }
    );
  } catch (error: any) {
    console.error("Failed to mark all notifications as read:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to mark all notifications as read"
    );
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (): Promise<any> => {
  try {
    const endpoint = getUserEndpoint.getUnreadNotificationsCount();
    const response = await apiClient.get<any>(endpoint).then((res) => res);
    // console.log("notification=>", response.data);
    return response;
  } catch (error: any) {
    console.error("Failed to get unread notifications count:", error);
    throw new Error(
      error.response?.data?.message ||
        "Failed to get unread notifications count"
    );
  }
};
// delete notification
export const deleteNotification = async (
  notificationId: string
): Promise<any> => {
  try {
    const endpoint = getUserEndpoint.deleteNotification(notificationId);
    const response = await apiClient.delete<any>(endpoint);
    return (
      response || { success: false, message: "Failed to delete notification" }
    );
  } catch (error: any) {
    console.error("Failed to delete notification:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete notification"
    );
  }
};
// delete all notifications
export const deleteAllNotifications = async (): Promise<any> => {
  try {
    const endpoint = getUserEndpoint.deleteAllNotifications();
    const response = await apiClient.delete<any>(endpoint);
    return (
      response || {
        success: false,
        message: "Failed to delete all notifications",
      }
    );
  } catch (error: any) {
    console.error("Failed to delete all notifications:", error);
    throw new Error(
      error.response?.data?.message || "Failed to delete all notifications"
    );
  }
};