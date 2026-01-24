import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, Bell, X } from "lucide-react";
// import Brand from "@/assets/svg/Brand.svg";
import { useUIStore } from "@/store/uiStore";
import { useUnreadNotificationsCountQuery } from "@/hooks/useNotificationServices";

interface PostsReelsHeaderProps {
  showCloseButton?: boolean;
  onClose?: () => void;
}

const PostsReelsHeader: React.FC<PostsReelsHeaderProps> = ({
  showCloseButton = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { openHeaderSearch } = useUIStore();
  const { data: unreadCountData } = useUnreadNotificationsCountQuery();
  const unreadCount = unreadCountData?.count || 0;

  const isPostsPage = pathname === "/posts" || pathname.startsWith("/posts/");
  const isReelsPage = pathname === "/reels" || pathname.startsWith("/reels/");

  const handleSearchClick = () => {
    openHeaderSearch();
  };

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  const handleSegmentChange = (segment: "posts" | "reels") => {
    if (segment === "posts" && !isPostsPage) {
      navigate("/posts");
    } else if (segment === "reels" && !isReelsPage) {
      navigate("/reels");
    }
  };

  return (
    <div className="sticky top-0 right-0 left-0 z-40 bg-white shadow-sm ">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="flex  h-14 items-center justify-between">
          {/* Left: Brand Logo (or close button on mobile) */}
          {showCloseButton ? (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            // <img
            //   src={Brand}
              // className="w-[7rem] md:w-[9rem] cursor-pointer"
              // alt="Brand Logo"
              // onClick={() => navigate("/")}
            // />
            <button
             className="w-[7rem] md:w-[9rem] cursor-pointer text-[#ff7a00] text-xl font-bold p-0"
              onClick={() => navigate("/")}>
              BoookBox
            </button>
          )}

          {/* Center: Segmented Control */}
          <div className="flex flex justify-center">
            <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
              <button
                onClick={() => handleSegmentChange("posts")}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-all ${
                  isPostsPage
                    ? "bg-white text-primary shadow-sm"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => handleSegmentChange("reels")}
                className={`px-3 py-1 rounded-md font-medium text-xs transition-all ${
                  isReelsPage
                    ? "bg-white text-primary shadow-sm"
                    : "bg-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                Reels
              </button>
            </div>
          </div>

          {/* Right: Search and Notification Icons */}
          <div className="flex items-center gap-2 md:gap-4 z-10">
            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className="rounded-full p-2 hover:bg-gray-100 cursor-pointer"
              aria-label="Search"
            >
              <Search className="h-6 w-6" />
            </button>

            {/* Notification Bell with Badge */}
            <button
              onClick={handleNotificationClick}
              className="relative rounded-full p-2 hover:bg-gray-100 cursor-pointer"
              aria-label="Notifications"
            >
              <div className="flex items-center justify-center cursor-pointer">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.6 -right-[1.8px] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white font-semibold">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostsReelsHeader;