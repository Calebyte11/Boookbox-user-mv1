import React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import Brand from "@/assets/svg/Brand.svg";
import Posts from "@/components/Posts";
import SEO from "@/components/SEO";
import { useUIStore } from "@/store/uiStore";
import { useUnreadNotificationsCountQuery } from "@/hooks/useNotificationServices";

const PostsPage: React.FC = () => {
  const navigate = useNavigate();
  const { openHeaderSearch } = useUIStore();
  const { data: unreadCountData } = useUnreadNotificationsCountQuery();
  const unreadCount = unreadCountData?.count || 0;

  const handleSearchClick = () => {
    openHeaderSearch();
  };

  const handleNotificationClick = () => {
    navigate("/notifications");
  };

  return (
    <>
      <SEO
        title="Community Posts"
        description="Explore community posts, gifts, and engagements around the world."
        keywords="community posts, gifting, donations, social engagement, restaurants and business stores"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "BoookBox Posts",
          description:
            "Explore posts, gifts, and engagements around the world.",
        }}
        ogImage="/pwa-192x192.png"
      />
      
      {/* Custom Page Header - Matches Home Header Aesthetic */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            {/* Left: Brand Logo */}
            <img
              src={Brand}
              className="w-[8rem] md:w-[10rem]"
              alt="Brand Logo"
              onClick={() => navigate("/")}
            />

            {/* Center: Posts Title */}
            <div className="mt-1 flex flex-1 justify-center">
              <h1 className="text-sm font-semibold text-gray-700">Posts</h1>
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

              {/* Notification Bell with Badge - Same as Header.tsx */}
              <button
                onClick={handleNotificationClick}
                className="relative rounded-full p-2 hover:bg-gray-100 cursor-pointer"
                aria-label="Notifications"
              >
                <div className="flex items-center justify-center cursor-pointer">
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.6 -right-[1.8px] flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Posts Feed */}
      <Posts />
    </>
  );
};

export default PostsPage;
