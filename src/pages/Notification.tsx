import { useState } from "react";
import Button from "@/components/Button";
import {
  ChevronLeft,
  Menu,
  Album,
  Check,
  Trash2,
  CheckCheck,
  MoreVertical,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationManager } from "@/hooks/useNotificationServices";
// import LoadingSpinner from "@/components/LoadingSpinner";
import type { NotificationItem } from "@/services/notificationService";

const Notification = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const {
    notifications,
    unreadCount,
    // hasUnreadNotifications,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingRead,
    isMarkingAllRead,
    isDeleting,
    notificationsError,
    refetchNotifications,
    deleteAllNotifications,
  } = useNotificationManager({ page: 1, limit: 50 });
  // console.log(notifications);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking":
        return <Album className="w-8 h-8 text-[#ff7a00]" />;
      case "payment":
        return <Album className="w-8 h-8 text-green-500" />;
      case "ticket":
        return <Album className="w-8 h-8 text-blue-500" />;
      case "system":
        return <Album className="w-8 h-8 text-purple-500" />;
      default:
        return <Album className="w-8 h-8 text-[#ff7a00]" />;
    }
  };
  // const handleMarkAsRead = (notificationId: string) => {
  //   markAsRead(notificationId);
  // };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    setShowMenu(false);
  };
  const handleDeleteAll = () => {
    deleteAllNotifications();
    setShowMenu(false);
  };
  const handleDeleteNotification = (notificationId: string) => {
    deleteNotification(notificationId);
    setActiveDropdown(null);
  };

  const handleMarkAsReadFromDropdown = (notificationId: string) => {
    markAsRead(notificationId);
    setActiveDropdown(null);
  };

  const toggleDropdown = (notificationId: string) => {
    setActiveDropdown(
      activeDropdown === notificationId ? null : notificationId
    );
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.notificationId || notification._id);
    }

    // Navigate to the action route if it exists
    if (notification.action) {
      if (
        notification.action.startsWith("/tickets/") ||
        notification.action.startsWith("/message/")
      ) {
        const ticketId = notification.action.split("/")[2];
        navigate(`/tickets/viewdetails/${ticketId}`);
        return;
      }
      if (
        notification.action.startsWith("/bookings/") ||
        notification.action.startsWith("/booking/")
      ) {
        const bookingId = notification.action.split("/")[2];
        navigate(`/bookings/${bookingId}`);
        return;
      }
      
      return;
    }
  };

  // Handle notification errors - but continue rendering with empty state if error
  if (notificationsError && isLoadingNotifications) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-between my-4">
          <Button
            className="rounded-xl p-2 bg-[#ECE6F0]"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6 text-black text-xl" />
          </Button>
          <h1 className="text-2xl">Notifications</h1>
          <div className="w-10" />
        </div>
        <div className="text-center py-12">
          <Album className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-red-600">
            Connection Error
          </h3>
          <p className="text-gray-600 mb-4">
            Failed to load notifications. Please check your connection and try again.
          </p>
          <Button
            onClick={() => refetchNotifications()}
            className="bg-primary text-white px-4 py-2 rounded-lg"
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  const notificationList = notifications || [];
  if (isLoadingNotifications) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[...Array(5)].map((_, idx) => (
          <div
            key={idx}
            className="flex gap-2 p-3 rounded-lg bg-gray-100 animate-pulse"
          >
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-300 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-gray-300 rounded" />
                <div className="h-4 w-6 bg-gray-200 rounded" />
              </div>
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="p-4">
      <div className="flex items-center justify-between top-0 fixed  mb-4 py-8 px-4 w-full left-0 bg-white z-50">
        <Button
          className="rounded-xl p-2 bg-[#ECE6F0]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-6 w-6 text-black text-xl" />
        </Button>
        <h1 className="text-2xl">
          Notification {unreadCount > 0 && `(${unreadCount})`}
        </h1>
        <div className="relative">
          <Button
            className="rounded-xl p-2 cursor-pointer"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Menu className="h-6 w-6 text-black text-xl" />
          </Button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute inline-flex flex-col right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg !z-[100] min-w-[200px]">
              {" "}
              <button
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                {isMarkingAllRead ? "Marking..." : "Mark all as read"}
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-2 border-b disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete all"}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Notifications List */}
      <div className="flex flex-col gap-3 my-18 md:my-4">
        {notificationList.length === 0 ? (
          <div className="text-center py-12">
            <Album className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        ) : (
          notificationList.map((notification: NotificationItem) => (
            <div key={notification._id}>
              <div
                className={`flex gap-2 p-3 rounded-lg transition-colors cursor-pointer hover:bg-gray-50 ${
                  !notification.isRead
                    ? "bg-blue-50 border-l-4 border-l-[#ff7a00] shadow"
                    : "bg-white"
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-shrink-0">
                  {getNotificationIcon(
                    notification.action?.startsWith("/tickets")
                      ? "ticket"
                      : notification.action?.startsWith("/bookings")
                      ? "booking"
                      : notification.action?.startsWith("/payment")
                      ? "payment"
                      : notification.action?.startsWith("/message")
                      ? "system"
                      : "default"
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900">
                      {notification.title}
                    </h4>
                    <div className="relative">
                      <Button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation(); // Prevent notification click when clicking menu
                          toggleDropdown(notification._id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="More actions"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </Button>

                      {/* Dropdown Menu for each notification */}
                      {activeDropdown === notification._id && (
                        <div
                          className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[160px]"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent notification click when clicking dropdown
                        >
                          {!notification.isRead && (
                            <button
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleMarkAsReadFromDropdown(
                                  notification?.notificationId ||
                                    notification._id
                                );
                              }}
                              disabled={isMarkingRead}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(
                                notification?.notificationId || ""
                              );
                            }}
                            disabled={isDeleting}
                            className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-2">
                    {notification.message}
                  </p>

                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDate(notification.createdAt)}</span>
                    {/* {!notification.isRead && (
                      <span className="bg-[#ff7a00] text-white px-2 py-1 rounded-full">
                        New
                      </span>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>{" "}
      {/* Click outside to close menu */}
      {(showMenu || activeDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowMenu(false);
            setActiveDropdown(null);
          }}
        />
      )}
    </section>
  );
};

export default Notification;
