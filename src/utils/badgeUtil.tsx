import { type JSX } from "react";
import { SpecialBadge } from "@/components/SpecialBadge";

interface BadgeConfig {
  label: string;
  icon: JSX.Element;
  bgColor?: string;
  iconColor: string;
}

const badgeConfig: Record<string, BadgeConfig> = {
  user: {
    label: "user",
    icon: <SpecialBadge size={24} color="#10B981" ariaLabel="User badge" className="bg-white rounded-full p-[1.3px]" />,
    iconColor: "text-[#10B981]",
  },
  founder: {
    label: "founder",
    icon: <SpecialBadge size={24} color="#EAB308" ariaLabel="Founder badge" className="bg-white rounded-full p-[1.3px]" />,
    iconColor: "text-[#EAB308]",
  },
  director: {
    label: "director",
    icon: <SpecialBadge size={24} color="#8B5CF6" ariaLabel="Director badge" className="bg-white rounded-full p-[1.3px]"/>,
    iconColor: "text-[#8B5CF6]",
  },
  developer: {
    label: "developer",
    icon: (
      <span className="bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full p-1 flex items-center justify-center w-6 h-6  border-white shadow [border-image:conic-gradient(from_180deg,theme(colors.blue.500)_0%,theme(colors.indigo.600)_100%)_1]">
        <SpecialBadge size={20} color="#ffffff" ariaLabel="Developer badge" />
      </span>
    ),
    bgColor: "bg-gradient-to-tr from-blue-500 to-indigo-600",
    iconColor: "text-white",
  },
  investor: {
    label: "investor",
    icon: <SpecialBadge size={24} color="#10B981" ariaLabel="Investor badge" className="bg-white rounded-full p-[1.3px]" />,
    iconColor: "text-[#10B981]",
  },
  charity: {
    label: "charity",
    icon: <SpecialBadge size={24} color="#EF4444" ariaLabel="Charity badge" className="bg-white rounded-full p-[1.3px]" />,
    iconColor: "text-[#EF4444]",
  },
  volunteer: {
    label: "volunteer",
    icon: <SpecialBadge size={24} color="#6B7280" ariaLabel="Volunteer badge" className="bg-white rounded-full p-[1.3px]" />,
    iconColor: "text-[#6B7280]",
  },
  restaurant: {
    label: "verified",
    icon: <SpecialBadge size={32} color="#10B981" ariaLabel="Verified restaurant badge" className="bg-white rounded-full p-[1.3px]" />,
    iconColor: "text-[#10B981]",
  },
};

export const hasBadges = (profileData: { badges?: string[] }) => {
  return Array.isArray(profileData?.badges) && profileData?.badges.length > 0;
};

export const getBorderColor = (profileData: { badges?: string[] }) => {
  if (!hasBadges(profileData)) return "border-gray-300";

  const badgeColorMap: Record<string, string> = {
    user: "border-green-500",
    founder: "border-yellow-500",
    director: "border-purple-500",
    developer: "border-blue-500",
    investor: "border-emerald-500",
    charity: "border-red-500",
    volunteer: "border-orange-500",
    restaurant: "border-blue-500",
  };

  const firstBadge = profileData?.badges?.[0];
  return firstBadge
    ? badgeColorMap[firstBadge] || "border-gray-300"
    : "border-gray-300";
};

export const getBadgeLabels = (profileData: { badges?: string[] }) => {
  const badges = profileData?.badges || [];
  if (!badges.length) return [];

  return badges.map((badge) => {
    const config = badgeConfig[badge];
    return config?.label || badge.charAt(0).toLowerCase() + badge.slice(1);
  });
};

export const renderBadges = (profileData: { badges?: string[] }) => {
  const badges = profileData?.badges || [];
  if (!badges.length) return null;

  const firstBadge = badges[0];
  // const remainingCount = badges.length - 1;

  const config = badgeConfig[firstBadge] || {
    label: firstBadge.charAt(0).toLowerCase() + firstBadge.slice(1),
    icon: <SpecialBadge size={24} color="#6B7280" ariaLabel={`${firstBadge} badge`} />,
    iconColor: "text-white",
  };

  return (
    <span className="relative inline-flex items-center">
      <BadgePill
        label={config.label}
        icon={config.icon}
        iconColor={config.iconColor}
      />

      {/* {remainingCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-6 h-6 rounded-full">
          <span className={`text-xs font-bold ${config.iconColor}`}>
            +{remainingCount}
          </span>
        </span>
      )} */}
    </span>
  );
};

const BadgePill = ({
  label,
  icon,
  iconColor,
}: {
  label: string;
  icon: JSX.Element;
  iconColor: string;
}) => {
  return (
    <span
      className={` px-1 rounded-full text-xs font-semibold text-white`}
      title={label}
    >
      <span className={`mr-1 ${iconColor}`}>{icon}</span>
    </span>
  );
};
