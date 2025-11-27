import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  // ToggleRight,
  ChevronDown,
  Loader2 as Loader,
  AlertCircle,
  CheckCircle,
  LogOut,
  Copy,
} from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import * as Switch from "@radix-ui/react-switch";
import * as Dialog from "@radix-ui/react-dialog";
import NotchAreaHeader from "@/components/NotchAreaHeader";
import ProfileImage from "@/components/ProfileImage";
import ImageOptionsModal from "@/components/ImageOptionsModal";
import CameraModal from "@/components/CameraModal";
import sponsorBanner from "@/assets/images/sponsorbanner.png";
import { Gift } from "lucide-react";
import { useAuth } from "@/features/auth/hooks";
import FormField from "@/components/FormField";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import * as RadixSelect from "@radix-ui/react-select";
import Button from "@/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  useUpdateProfile,
  type UpdateProfileRequest,
  // type ProfileResponse,
} from "@/services/profileService";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import NotificationSettings from "@/components/NotificationSettings";
import { useUserProfileQuery } from "@/hooks/useUserQueries";
import {
  convertBirthdayToDateString,
  convertDateStringToBirthday,
} from "@/utils/birthdayUtils";
import { ProfileSkeleton } from "@/components/SkeletonLoader";
import { renderBadges, hasBadges, getBorderColor } from "@/utils/badgeUtil";
import { SpecialBadge } from "@/components/SpecialBadge";
import ContactUsButton from "@/components/ContactUsButton";
import OrganizationCategoryDropdown from "@/components/OrganizationCategoryDropdown";
interface ProfileFormData {
  fullName: string;
  email: string;
  occupation?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  contactEmail?: string;
  organizationName?: string;
  category?: string;
  phoneNumber?: string;
  dateOfBirth?: string; // Date input field (YYYY-MM-DD format)
  gender?: string;
}

const schema = yup.object({
  fullName: yup.string().required("Full name is required"),
  occupation: yup.string(),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  address: yup.string(),
  city: yup.string(),
  state: yup.string(),
  country: yup.string(),
  contactEmail: yup.string().email("Invalid email format"),
  organizationName: yup.string(),
  category: yup.string(),
  phoneNumber: yup.string(),
  dateOfBirth: yup.string(),
  gender: yup.string(),
});

const RecipientProfile = () => {
  const { user, forceSignOut } = useAuth();
  const navigate = useNavigate();

  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  // Removed editMode state (fields are editable when Accordion is open)
  // const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [copiedFriend, setCopiedFriend] = useState(false);
  const [copiedBusiness, setCopiedBusiness] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Profile API hooks
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useUserProfileQuery();
  // Profile image upload functionality
  const {
    isUploading: isUploadingImage,
    error: uploadError,
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
    if (!profileData) return null;
    // Check if data is nested under 'data' property (new structure)
    if (profileData.data) return profileData.data;
    // Fallback to root level (old structure)
    return profileData;
  };

  const profile = getProfileData(); // Debug logs

  const updateProfileMutation = useUpdateProfile();

  // Local account-type state (user vs organization)
  const [isOrganization, setIsOrganization] = useState<boolean>(
    profile?.accountType === "organization"
  );

  // ======= for normal user referral =========
  const handleCopyReferral = async () => {
    if (profile?.referralCode) {
      const referralLink = `${window.location.origin}/auth/signup?referralCode=${profile.referralCode}`;
      const shareData = {
        title: "Join me on BoookBox!",
        text: "Sign up on BoookBox using my referral link. Let's connect and share meals!",
        url: referralLink,
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.error("Share failed:", err);
          // Fallback to copying link if share is cancelled or fails
          await navigator.clipboard.writeText(referralLink);
          setCopiedFriend(true);
          setTimeout(() => setCopiedFriend(false), 3000);
        }
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(referralLink);
        setCopiedFriend(true);
        setTimeout(() => setCopiedFriend(false), 3000);
      }
    }
  };

  // ========= FOR BUSINESS REFERRAL ========
  const handleCopyBusinessReferral = async () => {
    if (profile?.referralCode) {
      const referralLink = `${window.location.origin}/auth/business-signup?referralCode=${profile.referralCode}`;
      const shareData = {
        title: "Join my business on BoookBox!",
        text: "Sign up your business on BoookBox using my referral link. Let's connect and share meals!",
        url: referralLink,
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.error("Share failed:", err);
          // Fallback to copying link if share is cancelled or fails
          await navigator.clipboard.writeText(referralLink);
          setCopiedBusiness(true);
          setTimeout(() => setCopiedBusiness(false), 3000);
        }
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(referralLink);
        setCopiedBusiness(true);
        setTimeout(() => setCopiedBusiness(false), 3000);
      }
    }
  };

  // ========= Handle Copy referral code =========
  const handleCopyCode = async () => {
    if (profile?.referralCode) {
      try {
        await navigator.clipboard.writeText(profile.referralCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      } catch (err) {
        console.error("Failed to copy referral code:", err);
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = profile.referralCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 3000);
        } catch (fallbackErr) {
          console.error("Fallback copy failed:", fallbackErr);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  // Keep local toggle in sync with backend profile value
  useEffect(() => {
    setIsOrganization(profile?.accountType === "organization");
  }, [profile?.accountType]);

  // Dialog + pending state for confirming account switch
  const [isSwitchDialogOpen, setIsSwitchDialogOpen] = useState(false);
  const [pendingChecked, setPendingChecked] = useState<boolean | null>(null);

  // when user toggles, open confirmation dialog instead of immediate change
  const handleToggleRequest = (checked: boolean) => {
    setPendingChecked(checked);
    setIsSwitchDialogOpen(true);
  };

  const confirmSwitchAccount = async () => {
    if (pendingChecked === null) return;
    const newType = pendingChecked ? "organization" : "user";
    // optimistic UI
    setIsOrganization(pendingChecked);
    setIsSwitchDialogOpen(false);

    try {
      await updateProfileMutation.mutateAsync({
        accountType: newType,
      } as UpdateProfileRequest);
      await refetchProfile?.();
    } catch (err) {
      console.error("Failed to switch account type:", err);
      // revert optimistic change
      setIsOrganization(!pendingChecked);
    } finally {
      setPendingChecked(null);
    }
  };

  const cancelSwitch = () => {
    // simply close dialog and clear pending state
    setIsSwitchDialogOpen(false);
    setPendingChecked(null);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(schema),
  }); // Update form with profile data when it loads
  useEffect(() => {
    // console.log("📊 Profile data changed:", profileData);
    if (profile) {
      // console.log("🔄 Resetting form with profile data:", profile);
      // console.log("🔄 Birthday from profile:", profile.birthday);
      // console.log(
      //   "🔄 Converted date string:",
      //   convertBirthdayToDateString(profile.birthday)
      // );
      reset({
        fullName: profile.fullName || "",
        occupation: profile.occupation || "",
        email: profile.email || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        contactEmail: profile.contactEmail || "",
        organizationName: profile.organizationName || "",
        category: profile.category || "",
        phoneNumber: profile.phoneNumber || "",
        dateOfBirth: convertBirthdayToDateString(profile.birthday) || "",
        // Use optional chaining instead of casting to any
        gender: profile?.gender ?? "",
      });
    }
  }, [profile, reset, profileData]);

  const Icon = <ChevronRight className="w-5 h-5 text-primary" />;
  // Define which fields are not updatable (memoized so UI updates on account type change)
  const nonEditableFields = useMemo<(keyof ProfileFormData)[]>(() => {
    const base: (keyof ProfileFormData)[] = ["email"];
    if (profile?.accountType === "organization") base.push("contactEmail");
    return base;
  }, [profile?.accountType]);

  const profileItems = [
    {
      label: "Full Name",
      icon: Icon,
      field: "fullName" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "Gender",
      icon: Icon,
      field: "gender" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "Email",
      icon: Icon,
      field: "email" as keyof ProfileFormData,
      editable: false,
    },
    {
      label: "Date of Birth",
      icon: Icon,
      field: "dateOfBirth" as keyof ProfileFormData,
      editable: true,
      type: "date" as const,
    },
    {
      label: "Occupation",
      icon: Icon,
      field: "occupation" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "Address",
      icon: Icon,
      field: "address" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "City",
      icon: Icon,
      field: "city" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "State",
      icon: Icon,
      field: "state" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "Country",
      icon: Icon,
      field: "country" as keyof ProfileFormData,
      editable: true,
    },
    {
      label: "Phone Number",
      icon: Icon,
      field: "phoneNumber" as keyof ProfileFormData,
      editable: true,
      type: "tel" as const,
    },
    ...(profile?.accountType === "organization"
      ? [
          {
            label: "Organization Email",
            icon: Icon,
            field: "contactEmail" as keyof ProfileFormData,
            editable: true,
            type: "email" as const,
          },
          {
            label: "Organization Name",
            icon: Icon,
            field: "organizationName" as keyof ProfileFormData,
            editable: true,
          },
          {
            label: "Organization Category",
            icon: Icon,
            field: "category" as keyof ProfileFormData,
            editable: true,
            isDropdown: true,
          },
        ]
      : []),
  ];
  // Removed toggleEditMode (no longer needed)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      // Use forceSignOut to prevent race conditions
      forceSignOut();
      // Navigate after a brief delay to allow state to clear
      setTimeout(() => {
        navigate("/auth/login");
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  // Removed handleSaveField (no longer needed)
  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    try {
      const updateData: UpdateProfileRequest = {
        fullName: data.fullName,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        phoneNumber: data.phoneNumber,
        birthday: convertDateStringToBirthday(data.dateOfBirth || ""),
        // include gender if provided
        ...(data.occupation ? { occupation: data.occupation } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(profile?.accountType === "organization" && {
          contactEmail: data.contactEmail,
          organizationName: data.organizationName,
          category: data.category,
        }),
      };

      // console.log("🚀 Final update payload:", updateData);
      await updateProfileMutation.mutateAsync(updateData);
      // Reset all edit modes
      // setEditMode({});
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };
  // Loading state
  if (isLoadingProfile) {
    return <ProfileSkeleton />;
  }

  // Error state
  if (profileError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">Failed to load profile</p>
          <Button
            className="bg-primary text-white px-4 py-2 rounded-md"
            handleClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getDisplayName = () => {
    if (profileData?.accountType === "organization") {
      return profileData?.organizationName || user?.username || "Organization";
    }
    if (isLoadingProfile) {
      return " ";
    }
    return profileData?.fullName || user?.username || "User";
  };

  return (
    <section className="">
      <div className="relative w-full h-64 md:block hidden">
        <NotchAreaHeader
          imageUrl={sponsorBanner}
          imageAlt={"Profile Banner"}
          className="md:block hidden z-20"
        >
          {" "}
          <div className="absolute top-32 w-full">
            {" "}
            <div className="flex items-start gap-4 mb-4 z-10">
              {" "}
              {/* Profile Image */}{" "}
              <ProfileImage
                imageUrl={previewUrl || profileData?.profileImage}
                size="xl"
                editable={true}
                onEditClick={openImageOptions}
                name={watch("fullName") || user?.username || "User"}
                className={`shadow-lg border-2 ${getBorderColor(
                  profileData
                )} rounded-full`}
                isUploading={isUploadingImage}
              />
              <div className="flex flex-col gap-2 z-10">
                <div className="flex items-center">
                  <div className="text-2xl text-white capitalize inline-flex items-center text-pretty flex-wrap">
                    <span className="mr-1 font-mono font-bold">Hello,</span>
                    <span className=" font-bold font-[Inter] inline-flex items-center!">
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
                  className="rounded-xl bg-primary p-4 inline-flex gap-2 items-center text-white md:w-max w-full cursor-pointer"
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
      </div>{" "}
      {/* content  */}
      <div className="w-full max-w-3xl mx-auto p-4">
        {/* Success/Error Messages */}
        {updateProfileMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">Profile updated successfully!</p>
          </div>
        )}{" "}
        {updateProfileMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">
              Failed to update profile. Please try again.
            </p>
          </div>
        )}
        {/* Image Upload Error */}
        {uploadError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">
              Failed to upload profile image: {uploadError.message}
              <br />
              <span className="text-xs text-gray-700">
                Image size or dimensions do not meet requirements. Please ensure
                your image is under 5MB and meets the recommended dimensions.
              </span>
            </p>
          </div>
        )}
        {/* Image Upload Success */}
        {isUploadingImage && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            <p className="text-blue-800">Uploading profile image...</p>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Accordion.Root
            type="single"
            collapsible
            className="space-y-4"
            onValueChange={setOpenItem}
          >
            {" "}
            {/* Other profile items */}
            {profileItems.map((item) => (
              <Accordion.Item
                key={item.label}
                value={item.label}
                className="overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 border-b text-left">
                    <span className="text-gray-700 font-inter wrap-break-words">
                      {item.label}
                    </span>
                    {openItem === item.label ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      item.icon
                    )}
                  </Accordion.Trigger>
                </Accordion.Header>{" "}
                <Accordion.Content className="p-3 border-t border-gray-200">
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        {item.label}
                      </span>
                    </div>
                    {item.field === "phoneNumber" ? (
                      <FormField
                        name="phoneNumber"
                        type="tel"
                        register={register}
                        control={control}
                        errors={errors}
                        placeholder="Phone Number"
                        inputClassName="p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full"
                        className="mb-2"
                        disabled={
                          updateProfileMutation.isPending ||
                          nonEditableFields.includes(item.field)
                        }
                      />
                    ) : item.field === "category" ? (
                      <OrganizationCategoryDropdown
                        name="category"
                        control={control}
                        errors={errors}
                        placeholder="Select organization category"
                        disabled={
                          updateProfileMutation.isPending ||
                          nonEditableFields.includes(item.field)
                        }
                      />
                    ) : item.field === "gender" ? (
                      // Radix Select integrated with react-hook-form Controller
                      <div className="mb-2 w-full">
                        <Controller
                          name="gender"
                          control={control}
                          render={({ field }) => (
                            <RadixSelect.Root
                              value={field.value || ""}
                              onValueChange={(val) => field.onChange(val)}
                              disabled={
                                updateProfileMutation.isPending ||
                                nonEditableFields.includes(item.field)
                              }
                            >
                              <RadixSelect.Trigger
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Select gender"
                              >
                                <RadixSelect.Value placeholder="Select gender" />
                                <RadixSelect.Icon>
                                  <ChevronDown className="w-5 h-5 text-gray-500" />
                                </RadixSelect.Icon>
                              </RadixSelect.Trigger>

                              <RadixSelect.Portal>
                                <RadixSelect.Content className="mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                  <RadixSelect.Viewport className="p-1">
                                    <RadixSelect.Item
                                      className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                      value="male"
                                    >
                                      <RadixSelect.ItemText>
                                        Male
                                      </RadixSelect.ItemText>
                                      <RadixSelect.ItemIndicator>
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                      </RadixSelect.ItemIndicator>
                                    </RadixSelect.Item>

                                    <RadixSelect.Item
                                      className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                      value="female"
                                    >
                                      <RadixSelect.ItemText>
                                        Female
                                      </RadixSelect.ItemText>
                                      <RadixSelect.ItemIndicator>
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                      </RadixSelect.ItemIndicator>
                                    </RadixSelect.Item>

                                    <RadixSelect.Item
                                      className="px-3 py-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                      value="other"
                                    >
                                      <RadixSelect.ItemText>
                                        Other
                                      </RadixSelect.ItemText>
                                      <RadixSelect.ItemIndicator>
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                      </RadixSelect.ItemIndicator>
                                    </RadixSelect.Item>
                                  </RadixSelect.Viewport>
                                </RadixSelect.Content>
                              </RadixSelect.Portal>
                            </RadixSelect.Root>
                          )}
                        />
                        {errors.gender && (
                          <p className="text-sm text-red-600 mt-1">
                            {errors.gender.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <FormField
                        name={item.field}
                        register={register}
                        errors={errors}
                        disabled={
                          updateProfileMutation.isPending ||
                          nonEditableFields.includes(item.field)
                        }
                        inputClassName="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md w-full disabled:bg-gray-100 disabled:text-gray-500"
                        type={
                          item.field === "email" ||
                          item.field === "contactEmail"
                            ? "email"
                            : item.type === "date"
                            ? "date"
                            : "text"
                        }
                      />
                    )}
                  </div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>{" "}
          {/* Badges Section */}
          {hasBadges(profileData) && (
            <div className="border-b mb-2">
              <Accordion.Root type="single" collapsible>
                <Accordion.Item value="badges">
                  <Accordion.Header>
                    <Accordion.Trigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 text-left ">
                      <span className="text-gray-700 font-inter py-2">
                        Badges
                      </span>
                      {openItem === "badges" ? (
                        <ChevronDown className="w-5 h-5 text-primary transition-transform duration-200 accordion-chevron" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-primary transition-transform duration-200 accordion-chevron" />
                      )}
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="p-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">
                          Your Badges:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {(() => {
                          // Badge color mapping for consistency with badgeUtil
                          const badgeColorMap: Record<string, string> = {
                            user: "#10B981",
                            founder: "#EAB308",
                            director: "#8B5CF6",
                            developer: "#3B82F6",
                            investor: "#10B981",
                            charity: "#EF4444",
                            volunteer: "#6B7280",
                            restaurant: "#10B981",
                          };

                          return (profileData?.badges || []).map(
                            (badge: string, index: number) => {
                              const badgeColor =
                                badgeColorMap[badge] || "#6B7280";
                              const badgeTitle =
                                badge.charAt(0).toUpperCase() + badge.slice(1);

                              return (
                                <div
                                  key={index}
                                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 min-w-[120px]"
                                >
                                  <SpecialBadge
                                    size={48}
                                    color={badgeColor}
                                    ariaLabel={`${badgeTitle} badge`}
                                    title={`${badgeTitle} Badge - Special achievement unlocked!`}
                                    className="drop-shadow-sm"
                                  />
                                  <span className="text-sm font-medium text-gray-700 text-center">
                                    {badgeTitle}
                                  </span>
                                </div>
                              );
                            }
                          );
                        })()}
                      </div>
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            </div>
          )}
          {/* Dark Mode Toggle */}
          {/* <div className="flex items-center justify-between w-full p-3 border-b mb-2 ">
            <span className="text-gray-700 font-inter">Dark Mode</span>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="focus:outline-none"
              aria-label="Toggle Dark Mode"
            >
              <ToggleRight
                className={`w-8 h-8 ${
                  isDarkMode ? "text-primary" : "text-gray-500"
                }`}
              />
            </button>
          </div> */}
          {/* Notification Settings */}
          <div className="border-b mb-2">
            <Accordion.Root type="single" collapsible>
              <Accordion.Item value="notifications">
                <Accordion.Header>
                  <Accordion.Trigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 text-left">
                    <span className="text-gray-700 font-inter mt-4">
                      Notification
                    </span>
                    {openItem === "notifications" ? (
                      <ChevronDown className="w-5 h-5 text-primary transition-transform duration-200 accordion-chevron" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-primary transition-transform duration-200 accordion-chevron" />
                    )}
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="p-3 border-t border-gray-200">
                  <NotificationSettings className="mt-2" />
                </Accordion.Content>
              </Accordion.Item>
            </Accordion.Root>
          </div>
          <div className="flex items-center justify-between w-full p-3 border-b mb-2 ">
            <span className="text-gray-700 font-inter mt-3">Promote an Ad</span>
            <button>
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </div>
          {/* =========== Referral Section ==========*/}
          {profile?.referralCode && (
            <div>
              {/* ========== Referral for friend ======= */}
              <div className="flex items-center justify-between w-full p-3 border-b mb-2">
                <div>
                  <div className="text-gray-700 font-inter">
                    Invite a friend
                  </div>
                  <div className="text-sm text-gray-500">
                    Copy your referral link and share it.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary-light rounded-lg hover:bg-primary-dark-light focus:outline-none cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copiedFriend ? "Copied!" : "Copy Link"}
                </button>
              </div>
              {/* ======== Referal for Business ======= */}
              <div className="flex items-center justify-between w-full p-3 border-b mb-2">
                <div>
                  <div className="text-gray-700 font-inter">
                    Invite a business
                  </div>
                  <div className="text-sm text-gray-500">
                    Copy your referral link and share it.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBusinessReferral}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary-light rounded-lg hover:bg-primary-dark-light focus:outline-none cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copiedBusiness ? "Copied!" : "Copy Link"}
                </button>
              </div>

              {/* ========== copy referral code ======= */}
              <div className="flex items-center justify-between w-full p-3 border-b mb-2">
                <div>
                  <div className="text-gray-700 font-inter">Referral code</div>
                  <div className="text-sm text-gray-500">
                    {profile.referralCode}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary bg-primary-light rounded-lg hover:bg-primary-dark-light focus:outline-none cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  {copiedCode ? "Copied!" : "Copy Code"}
                </button>
              </div>
            </div>
          )}
          {/* Account Type Switch (only show when profile is loaded) */}
          {profile && (
            <div className="flex items-center justify-between w-full p-3 border-b mb-2">
              <div>
                <div className="text-gray-700 font-inter">Account Type</div>
                <div className="text-sm text-gray-500">
                  Toggle to switch between User and Organization account
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Current:{" "}
                  <span className="font-semibold">
                    {profile.accountType || "user"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm">
                  {isOrganization ? "Organization" : "User"}
                </span>

                <Switch.Root
                  className="w-12 h-7 bg-gray-200 rounded-full relative data-[state=checked]:bg-primary"
                  checked={isOrganization}
                  onCheckedChange={(v) => handleToggleRequest(Boolean(v))}
                  disabled={updateProfileMutation.isPending}
                  aria-label="Switch account type"
                >
                  <Switch.Thumb className="block w-6 h-6 bg-white rounded-full shadow transform transition-transform translate-x-0 data-[state=checked]:translate-x-5" />
                </Switch.Root>

                {/* Confirmation Dialog for switching account type */}
                <Dialog.Root
                  open={isSwitchDialogOpen}
                  onOpenChange={setIsSwitchDialogOpen}
                >
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg z-50">
                      <Dialog.Title className="text-lg font-semibold mb-2">
                        Confirm Account Switch
                      </Dialog.Title>
                      <p className="text-gray-700 mb-4">
                        Are you sure you want to switch your account to{" "}
                        <span className="font-semibold">
                          {pendingChecked ? "Organization" : "User"}
                        </span>
                        ? This may change available fields and permissions.
                      </p>

                      <div className="flex justify-end gap-3">
                        <Dialog.Close asChild>
                          <Button
                            type="button"
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                            onClick={cancelSwitch}
                          >
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Button
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                          onClick={confirmSwitchAccount}
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending
                            ? "Switching..."
                            : "Confirm"}
                        </Button>
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              </div>
            </div>
          )}
          <ContactUsButton
            className=" mb-16 flex justify-end"
            showLabel={false}
          />
          {/* Save All Changes Button (submit) */}
          <Button
            type="submit"
            className="flex items-center justify-center w-full p-3 my-4 bg-primary text-white rounded-lg disabled:opacity-50"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Saving Profile...
              </>
            ) : (
              "Save All Profile Changes"
            )}
          </Button>
          {/* Logout Button */}
          <Button
            className="flex items-center justify-center w-full p-3 my-4 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
            handleClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </form>
        {/* Profile Completion Indicator */}
        {(() => {
          // Calculate profile completion percentage with live updates
          const calculateProfileCompletion = () => {
            if (!profile) return 0;

            const requiredFields = [
              "fullName",
              "email",
              "address",
              "city",
              "state",
              "country",
              "phoneNumber",
              "dateOfBirth",
            ];

            // Get current form values for live updates
            const currentValues = watch();

            const completedFields = requiredFields.filter((field) => {
              if (field === "dateOfBirth") {
                const dateValue = currentValues.dateOfBirth;
                return dateValue && dateValue.trim() !== "";
              }

              const fieldValue = currentValues[field as keyof ProfileFormData];
              return (
                fieldValue &&
                typeof fieldValue === "string" &&
                fieldValue.trim() !== ""
              );
            });

            return Math.round(
              (completedFields.length / requiredFields.length) * 100
            );
          };

          const completionPercentage = calculateProfileCompletion();
          const isProfileComplete = completionPercentage === 100;

          if (isProfileComplete) return null;

          return (
            <div className="bg-linear-to-r from-primary/10 to-orange-100 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Complete Your Profile to Claim Meals
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Complete your profile information to unlock the ability to
                    claim and receive meals from restaurants.
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Profile Completion
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-linear-to-r from-primary to-orange-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Fill in your personal information above to reach 100%
                    completion.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
      {/* Image Options Modal */}
      <ImageOptionsModal
        isOpen={showImageOptions}
        onClose={closeImageOptions}
        onCameraSelect={openCamera}
        onFileSelect={handleFileSelect}
        isUploading={isUploadingImage}
      />{" "}
      {/* Camera Modal */}
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
    </section>
  );
};
export default RecipientProfile;
