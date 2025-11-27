import React from "react";
import Layout from "./layout";
import { renderBadges, hasBadges, getBorderColor } from "@/utils/badgeUtil";
import { Gift } from "lucide-react";
import { useAuth } from "@/features/auth/hooks";
import sponsorBanner from "@/assets/images/sponsorbanner.png";
import ProfileImage from "@/components/ProfileImage";
import ImageOptionsModal from "@/components/ImageOptionsModal";
import CameraModal from "@/components/CameraModal";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import { useUserProfileQuery } from "@/hooks/useUserQueries";
import { useNavigate } from "react-router-dom";
import { useMealHeaderStore } from "@/store/mealHeaderStore";
import NotchAreaHeader from "@/components/NotchAreaHeader";
import Button from "./Button";
import { ChevronLeft } from "lucide-react";
import { HeaderFactory } from "@/components/headers";
import type { HeaderType } from "@/components/headers";

interface HeaderPageLayoutProps {
  children: React.ReactNode;
  title: string;
  showSearch?: boolean;
  headerType?: HeaderType;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  onBackClick?: () => void;
  // Legacy restaurant-specific props (for backward compatibility)
  restaurantData?: {
    name: string;
    banner: string;
    id?: string;
    restaurantId?: string;
  };
  onHeartClick?: () => void;
}

const HeaderPageLayoutV2: React.FC<HeaderPageLayoutProps> = ({
  children,
  title,
  showSearch = false,
  headerType = "default",
  searchPlaceholder = "Search",
  onSearchChange,
  onBackClick,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile data and image upload functionality (for profile header)
  const { data: rawProfileData } = useUserProfileQuery();
  const {
    isUploading: isUploadingImage,
    previewUrl,
    showImageOptions,
    openImageOptions,
    closeImageOptions,
    handleFileSelect,
    openCamera,
    cameraCapture,
  } = useProfileImageUpload();

  // Helper function to safely get profile data
  const getProfileData = () => {
    if (!rawProfileData) return null;
    if (rawProfileData.data) return rawProfileData.data;
    return rawProfileData;
  };

  const profileData = getProfileData();

  // Meal header using zustand store
  const meal = useMealHeaderStore((state) => state.meal);

  // Generate header based on type
  const renderHeader = () => {
    switch (headerType) {
      case "restaurant":
        return (
          <HeaderFactory
            type="restaurant"
            props={{ onBackClick }}
          />
        );

      case "groceries":
        return (
          <HeaderFactory
            type="groceries"
            props={{ onBackClick }}
          />
        );
      
      case "frozen-foods":
        return (
          <HeaderFactory
            type="frozen-foods"
            props={{ onBackClick }}
          />
        );

      case "wine-drinks":
        return (
          <HeaderFactory
            type="wine-drinks"
            props={{ onBackClick }}
          />
        );

      case "profile":
        return renderProfileHeader();

      case "meal":
        return renderMealHeader();

      case "simple":
        return (
          <HeaderFactory
            type="simple"
            props={{}}
          />
        );

      case "default":
      default:
        return (
          <HeaderFactory
            type="default"
            props={{
              title,
              showSearch,
              searchPlaceholder,
              onSearchChange,
            }}
          />
        );
    }
  };

  // Legacy profile header implementation (to be refactored later)
  const renderProfileHeader = () => {
    const getDisplayName = () => {
      if (profileData?.accountType === "organization") {
        return profileData?.organizationName || user?.username || "Organization";
      }
      return `${profileData?.fullName}` || user?.username || "User";
    };

    return (
      <NotchAreaHeader
        imageUrl={profileData?.banner || sponsorBanner}
        imageAlt={"Profile Banner"}
      >
        <div className="absolute top-[13dvh] text-pretty z-30">
          <div className="flex items-start gap-4 mb-4">
            <ProfileImage
              imageUrl={previewUrl || profileData?.profileImage}
              size="xl"
              editable={true}
              onEditClick={openImageOptions}
              name={profileData?.fullName || user?.username || "User"}
              className={`shadow-lg border-2 ${getBorderColor(
                profileData
              )} rounded-full`}
              isUploading={isUploadingImage}
            />
            <div className="flex flex-col gap-2 z-10">
              <div className="flex items-center">
                <div className="text-2xl text-white capitalize inline-flex items-center text-pretty flex-wrap">
                  <span className="mr-1 font-mono font-bold">Hello,</span>
                  <span className=" font-bold font-[Inter] inline-flex !items-center">
                    {getDisplayName()}
                    {hasBadges(profileData) && (
                      <span className="relative inline-flex items-center ">
                        {renderBadges(profileData)}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div
                className="rounded-xl bg-primary p-4 inline-flex gap-2 items-center text-white w-max !z-30"
                onClick={() => navigate("/restaurants/view-all")}
              >
                <div className="rounded-lg bg-white text-primary w-8 h-8 flex items-center p-2">
                  <Gift className="w-5 h-5" />
                </div>
                <p className="">Gift a Meal Today</p>
              </div>
            </div>
          </div>
        </div>
      </NotchAreaHeader>
    );
  };

  // Legacy meal header implementation (to be refactored later)
  const renderMealHeader = () => {
    const handleBackClick = onBackClick || (() => navigate(-1));
    
    return meal ? (
      <NotchAreaHeader imageUrl={meal.image} imageAlt={meal.name}>
        <div className="flex justify-between mt-5">
          <Button
            className="p-4 bg-white rounded-xl z-40"
            onClick={handleBackClick}
          >
            <ChevronLeft className="w-[24px]" />
          </Button>
        </div>
        <div className="absolute bottom-6 left-0 w-full px-4 z-20">
          <div className="">
            {meal.category && <span className="text-sm text-gray-200"></span>}
            {meal.description && <p className="text-sm mt-2 text-gray-100"></p>}
          </div>
        </div>
      </NotchAreaHeader>
    ) : null;
  };

  return (
    <>
      <Layout
        customHeader={renderHeader()}
        showDefaultHeader={headerType !== "default"}
      >
        {children}
      </Layout>
      
      {/* Image Options Modal (for profile header) */}
      <ImageOptionsModal
        isOpen={showImageOptions}
        onClose={closeImageOptions}
        onCameraSelect={openCamera}
        onFileSelect={handleFileSelect}
        isUploading={isUploadingImage}
      />
      
      {/* Camera Modal (for profile header) */}
      <CameraModal
        isOpen={cameraCapture.isOpen}
        onClose={cameraCapture.closeModal}
        onCapture={cameraCapture.capturePhoto}
        onSwitchCamera={cameraCapture.switchCamera}
        videoRef={cameraCapture.videoRef as React.RefObject<HTMLVideoElement>}
        canvasRef={
          cameraCapture.canvasRef as React.RefObject<HTMLCanvasElement>
        }
        hasPermission={cameraCapture.hasPermission}
        isLoading={cameraCapture.isLoading}
      />
    </>
  );
};

export default HeaderPageLayoutV2;
