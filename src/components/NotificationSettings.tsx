import React from "react";
import { Bell, Settings, Volume2, VolumeX, Check, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import useAuthStore from "@/store/authStore";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface NotificationSettingsProps {
  className?: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = "",
}) => {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    settings,
    requestPermission,
    enableNotifications,
    disableNotifications,
    updateSettings,
    showTestNotification,
  } = useNotifications();

  const { user } = useAuthStore();

  const getPermissionStatusColor = () => {
    switch (permission) {
      case "granted":
        return "text-green-600";
      case "denied":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  const getPermissionStatusText = () => {
    switch (permission) {
      case "granted":
        return "Granted";
      case "denied":
        return "Denied";
      default:
        return "Not Asked";
    }
  };

  if (!isSupported || !user) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Bell className="h-5 w-5" />
          <span className="text-sm">
            Push notifications are not supported in this browser.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell
              className={`h-6 w-6 ${
                settings.enabled ? "text-primary" : "text-gray-400"
              }`}
            />
            {isSubscribed && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">
              Get notified about orders, new meals, and updates
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={
              settings.enabled ? disableNotifications : enableNotifications
            }
            disabled={isLoading}
            className={`${
              settings.enabled
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-primary text-white hover:bg-primary/90  text-sm cursor-pointer"
            } px-3 py-1`}
          >
            {isLoading && settings.enabled
              ? "Disabling..."
              : settings.enabled
              ? "Disable"
              : "Subscribe"}
          </button>

      
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[220px] bg-white rounded-md p-2 shadow-lg border border-gray-200 will-change-[opacity,transform] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade"
                sideOffset={2}
              >
                <div className="p-2 space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Notification Preferences
                  </h4>

                  {/* Notification Types */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">
                            Order Updates
                          </div>
                          <div className="text-xs text-gray-500">
                            Payment confirmations, delivery status
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            orderUpdates: !settings.orderUpdates,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.orderUpdates ? "bg-primary" : "bg-gray-200"
                        }`}
                        disabled={!settings.enabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.orderUpdates
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">New Meals</div>
                          <div className="text-xs text-gray-500">
                            New restaurants and menu items
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({ newMeals: !settings.newMeals })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.newMeals ? "bg-primary" : "bg-gray-200"
                        }`}
                        disabled={!settings.enabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.newMeals
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-sm">Promotions</div>
                          <div className="text-xs text-gray-500">
                            Special offers and discounts
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({ promotions: !settings.promotions })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.promotions ? "bg-primary" : "bg-gray-200"
                        }`}
                        disabled={!settings.enabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.promotions
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {settings.soundEnabled ? (
                          <Volume2 className="h-4 w-4 text-gray-600" />
                        ) : (
                          <VolumeX className="h-4 w-4 text-gray-600" />
                        )}
                        <div>
                          <div className="font-medium text-sm">Sound</div>
                          <div className="text-xs text-gray-500">
                            Play sound with notifications
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updateSettings({
                            soundEnabled: !settings.soundEnabled,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.soundEnabled ? "bg-primary" : "bg-gray-200"
                        }`}
                        disabled={!settings.enabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.soundEnabled
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-4 border-t">
                    {permission !== "granted" && (
                      <button
                        onClick={requestPermission}
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded text-sm"
                      >
                        <Bell className="h-4 w-4" />
                        <span>Request Permission</span>
                      </button>
                    )}

                    {permission === "granted" && (
                      <button
                        onClick={showTestNotification}
                        disabled={isLoading || !isSubscribed}
                        className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded text-sm"
                      >
                        <Check className="h-4 w-4" />
                        <span>Test Notification</span>
                      </button>
                    )}
                  </div>
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>

      {/* Status Information */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Permission</div>
          <div className={`font-medium ${getPermissionStatusColor()}`}>
            {getPermissionStatusText()}
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Status</div>
          <div
            className={`font-medium ${
              isSubscribed ? "text-green-600" : "text-gray-600"
            }`}
          >
            {isSubscribed ? "Subscribed" : "Not Subscribed"}
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Browser Support</div>
          <div
            className={`font-medium ${
              isSupported ? "text-green-600" : "text-red-600"
            }`}
          >
            {isSupported ? "Supported" : "Not Supported"}
          </div>
        </div>
      </div>

      {/* Help Text */}
      {permission === "denied" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <X className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-red-800">
                Notifications Blocked
              </div>
              <div className="text-red-600 mt-1">
                To enable notifications, click the bell icon in your browser's
                address bar and change the permission to "Allow".
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
