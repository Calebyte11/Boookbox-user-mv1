import { Home, Gift, User, LogOut, Clapperboard, MessageSquare } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks";
import { useNavStore } from "@/store/navStore";
import { useUIStore } from "@/store/uiStore";
import { useUserProfileQuery } from "@/hooks/useUserQueries";

const NAV_ITEMS = [
  { name: "home", icon: Home, label: "Home", path: "/home" },
  // { name: "search", icon: Search, label: "Search", path: "/#search" },
  { name: "gift", icon: Gift, label: "Gifts", path: "/gifts" },
  { name: "reels", icon: Clapperboard, label: "Reels", path: "/reels" },
  { name: "posts", icon: MessageSquare, label: "Posts", path: "/posts" },
  { name: "profile", icon: User, label: "Profile", path: "/profile" },
];

const Navigation = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, forceSignOut } = useAuth();
  const { activeNav, setActiveNav } = useNavStore();
  const { openHeaderSearch } = useUIStore();
  const { data: profileData } = useUserProfileQuery();
  const [showGiftFilter, setShowGiftFilter] = useState(false);
  const [giftFilter, setGiftFilter] = useState<"gifts" | "tickets">("gifts");

  const handleNavClick = (path: string, name: string) => {
    if (name === "search") {
      openHeaderSearch();
      setActiveNav(name);
    } else if (name === "gift") {
      // Show filter modal for gift navigation
      setShowGiftFilter(true);
      setActiveNav(name);
    } else {
      setActiveNav(name);
      navigate(path);
    }
  };

  const handleGiftFilterChange = (filter: "gifts" | "tickets") => {
    setGiftFilter(filter);
    setShowGiftFilter(false);
    setActiveNav("gift");
    navigate(filter === "gifts" ? "/gifts" : "/tickets");
  };

  const isActive = (itemName: string) => {
    if (activeNav) return activeNav === itemName;
    const navItem = NAV_ITEMS.find((item) => item.name === itemName);
    if (!navItem) return false;
    if (itemName === "home") {
      return pathname === "/home" || pathname === "/";
    }
    if (itemName === "gift") {
      return pathname === "/gifts" || pathname.startsWith("/gifts/") || pathname === "/tickets" || pathname.startsWith("/tickets/");
    }
    if (itemName === "posts") {
      return pathname === "/posts" || pathname.startsWith("/posts/");
    }
    if (itemName === "profile") {
      return pathname === "/profile" || pathname.startsWith("/profile/");
    }
    if (itemName === "reels") {
      return pathname === "/reels" || pathname.startsWith("/reels/");
    }
    if (itemName === "search") {
      return pathname.includes("search") || pathname.includes("restaurants");
    }
    return pathname === navItem.path;
  };

  const handleLogout = () => {
    // Use forceSignOut to prevent race conditions
    if (forceSignOut) {
      forceSignOut();
      // Navigate after a brief delay to allow state to clear
      setTimeout(() => {
        navigate("/auth/login");
        setActiveNav("login");
      }, 100);
    }
  };

  return (
    <>
      {/* Mobile Navigation (Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg md:hidden px-4 py-2">
        <ul className="mx-auto flex max-w-7xl justify-between px-4 py-3">
          {NAV_ITEMS.map(({ name, icon: Icon, path, label }) => (
            <li
              key={name}
              className="flex cursor-pointer flex-col items-center"
              onClick={() => handleNavClick(path, name)}
            >
              <Icon
                className={`
                  h-6 w-6 mb-1
                  ${isActive(name) ? "text-primary" : "text-gray-600"}`}
              />
              <span
                className={`
                  text-xs capitalize
                  ${
                    isActive(name)
                      ? "font-medium text-primary"
                      : "text-gray-600"
                  }
                `}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Gift Filter Modal */}
      {showGiftFilter && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowGiftFilter(false)}>
          <div 
            className="fixed bottom-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-3">View</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleGiftFilterChange("gifts")}
                className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors ${
                  giftFilter === "gifts"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Gifts
              </button>
              <button
                onClick={() => handleGiftFilterChange("tickets")}
                className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors ${
                  giftFilter === "tickets"
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                Tickets
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation (Sidebar) */}
      <nav className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col bg-white pt-20 shadow-lg md:flex">
        <div className="flex flex-1 flex-col overflow-y-auto px-4">
          <div className="mt-8 flex flex-col space-y-1">
            {NAV_ITEMS.map(({ name, icon: Icon, path, label }) => (
              <button
                key={name}
                onClick={() => handleNavClick(path, name)}
                className={`flex items-center rounded-lg px-4 py-3 text-left transition-colors
                  ${
                    isActive(name)
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="mr-3 h-5 w-5 shrink-0" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* User Profile Section */}
        {user && (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <div className="border-t border-primary p-4 cursor-pointer hover:bg-gray-50">
                <div className="flex items-center">
                  <div className="mr-3 h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                    {profileData?.profileImage ? (
                      <img
                        src={profileData?.profileImage}
                        alt={`${profileData?.fullname}-profile`}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <User size={20} className="text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {user?.username || "User"}
                    </p>
                  </div>
                </div>
              </div>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="bg-white shadow-md rounded-lg p-2 mt-1 w-48 border border-gray-200 z-50"
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Item
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary rounded-md cursor-pointer focus:outline-none focus:bg-primary/10 focus:text-primary"
                  onSelect={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        )}
      </nav>
    </>
  );
};

export default Navigation;
