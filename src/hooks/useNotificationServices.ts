/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadNotificationsCount,
  type NotificationsResponse,
  type MarkReadResponse,
  type NotificationCountResponse,
} from "@/services/notificationService";

// Query keys for caching
export const notificationQueryKeys = {
  all: "notifications",
  list: (params?: any) => ["notifications", "list", params] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
} as const;

// Hook to fetch all notifications with pagination
export const useNotificationsListQuery = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery<NotificationsResponse>({
    queryKey: notificationQueryKeys.list(params),
    queryFn: () => getAllNotifications(params?.page || 1, params?.limit || 20),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true, // Refetch when window becomes active
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
};

// Hook to fetch unread notifications count
export const useUnreadNotificationsCountQuery = () => {
  return useQuery<NotificationCountResponse>({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: () => getUnreadNotificationsCount(),
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Auto refetch every 30 seconds
    refetchOnWindowFocus: true, // Refetch when window becomes active
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
};

// Mutation hook to mark a notification as read
export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Mark as Read",
        description: error.message || "Something went wrong. Please try again.",
        variant: "error",
      });
    },
  });
};

// Mutation hook to mark all notifications as read
export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MarkReadResponse, Error>({
    mutationFn: () => markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Mark All as Read",
        description: error.message || "Something went wrong. Please try again.",
        variant: "error",
      });
    },
  });
};

// Mutation hook to delete a notification
export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        refetchType: "all",
      });
      toast({
        title: "Notification Deleted",
        description: "The notification has been deleted successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete Notification",
        description: error.message || "Something went wrong. Please try again.",
        variant: "error",
      });
    },
  });
};

// Delete all notifications mutation
export const useDeleteAllNotificationsMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<MarkReadResponse, Error>({
    mutationFn: () => deleteAllNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "list"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
        refetchType: "all",
      });
      toast({
        title: "All Notifications Deleted",
        description: "All your notifications have been deleted successfully.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete All Notifications",
        description: error.message || "Something went wrong. Please try again.",
        variant: "error",
      });
    },
  });
};

// Combined hook for notification operations
export const useNotificationOperations = () => {
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();
  const deleteAllMutation = useDeleteAllNotificationsMutation();

  const markAsRead = (notificationId: string) => {
    markReadMutation.mutateAsync(notificationId);
  };

  const markAllAsRead = () => {
    markAllReadMutation.mutateAsync();
  };

  const deleteNotification = (notificationId: string) => {
    deleteMutation.mutateAsync(notificationId);
  };
  const deleteAllNotifications = () => {
    deleteAllMutation.mutateAsync();
  };

  return {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    markReadError: markReadMutation.error,
    markAllReadError: markAllReadMutation.error,
    deleteError: deleteMutation.error,
    deleteAllError: deleteAllMutation.error,
  };
};

// Hook for managing notifications in a single component
export const useNotificationManager = (params?: {
  page?: number;
  limit?: number;
}) => {
  const notifications = useNotificationsListQuery(params);
  const unreadCount = useUnreadNotificationsCountQuery();
  const operations = useNotificationOperations();

  const hasUnreadNotifications = (unreadCount.data?.count || 0) > 0;

  // Push the latest notification using browser Notification API
  const pushLatestNotification = () => {
    if (!("Notification" in window)) return;
    if (window.Notification.permission !== "granted") return;
    const latest = notifications.data?.data?.[0];
    if (!latest) return;
    new window.Notification(latest.title || "Notification", {
      body: latest.message || "",
      icon: "/android-chrome-192x192.png",
      badge: "/android-chrome-192x192.png",
      tag: `notif-${latest._id}`,
      data: latest,
    });
  };

  return {
    // Data
    notifications: notifications.data?.data || [],
    pagination: notifications.data?.pagination,
    unreadCount: unreadCount.data?.count || 0,
    hasUnreadNotifications,
    deleteAllNotifications: operations.deleteAllNotifications,

    // Loading states
    isLoadingNotifications: notifications.isLoading,
    isLoadingUnreadCount: unreadCount.isLoading,
    isMarkingRead: operations.isMarkingRead,
    isMarkingAllRead: operations.isMarkingAllRead,
    isDeleting: operations.isDeleting,

    // Error states
    notificationsError: notifications.error,
    unreadCountError: unreadCount.error,
    operationErrors: {
      markRead: operations.markReadError,
      markAllRead: operations.markAllReadError,
      delete: operations.deleteError,
    },

    // Actions
    markAsRead: operations.markAsRead,
    markAllAsRead: operations.markAllAsRead,
    deleteNotification: operations.deleteNotification,

    // Refetch functions
    refetchNotifications: notifications.refetch,
    refetchUnreadCount: unreadCount.refetch,

    // Push notification action
    pushLatestNotification,
  };
};
