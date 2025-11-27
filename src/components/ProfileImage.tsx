import React from "react";
import { Camera, User } from "lucide-react";
import { Avatar } from "radix-ui";

interface ProfileImageProps {
  imageUrl?: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onEditClick?: () => void;
  className?: string;
  name?: string;
  isUploading?: boolean;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUrl,
  size = "lg",
  editable = false,
  onEditClick,
  className = "",
  name = "User",
  isUploading = false,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  };

  const editButtonSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
  };

  const handleImageSelect = () => {
    if (onEditClick) {
      onEditClick();
    }
  };

  // Get initials from name for fallback
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Profile Image Container */}
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          overflow-hidden
          border-2
          border-gray-200
          bg-gray-100
          flex
          items-center
          justify-center
          relative
          ${isUploading ? "animate-pulse" : ""}
        `}
      >
        <Avatar.Root className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
          <Avatar.Image
            src={imageUrl}
            alt={`${name}'s profile`}
            className="w-full h-full object-cover"
          />
          <Avatar.Fallback
            className="flex items-center justify-center w-full h-full"
            delayMs={100}
          >
            {name ? (
              <span
          className="font-semibold text-gray-700"
          style={{ fontSize: `${iconSizes[size] * 0.6}px` }}
              >
          {getInitials(name)}
              </span>
            ) : (
              <User size={iconSizes[size]} className="text-gray-500" />
            )}
          </Avatar.Fallback>
        </Avatar.Root>

        {/* Upload overlay for when uploading */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Edit Button */}
      {editable && (
        <button
          className={`
            absolute
            -bottom-1
            -right-1
            ${editButtonSizes[size]}
            rounded-full
            bg-primary
            text-white
            border-2
            border-white
            shadow-lg
            hover:bg-primary/90
            transition-colors
            flex
            items-center
            justify-center
            p-0
            disabled:opacity-50
            disabled:cursor-not-allowed
          `}
          onClick={handleImageSelect}
          disabled={isUploading}
          aria-label="Change profile picture"
        >
          <Camera size={size === "sm" ? 12 : size === "md" ? 14 : 16} />
        </button>
      )}
    </div>
  );
};

export default ProfileImage;
