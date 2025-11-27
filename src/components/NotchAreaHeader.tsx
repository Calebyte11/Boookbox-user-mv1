import React, { useEffect } from "react";
// import banner from "@/assets/images/sponsorbanner.png";

interface NotchAreaHeaderProps {
  imageUrl: string;
  imageAlt: string;
  gradientDirection?: string;
  gradientColorStops?: string;
  children: React.ReactNode;
  className?: string;
  imageClassName?: string;
  gradientClassName?: string;
  contentClassName?: string;
}

const NotchAreaHeader: React.FC<NotchAreaHeaderProps> = ({
  imageUrl,
  imageAlt,
  gradientDirection = "to-t",
  gradientColorStops = "from-black/80 to-transparent",
  children,
  className = "relative w-full min-h-64 ",
  imageClassName = "absolute inset-0 w-full h-full object-cover",
  gradientClassName = "absolute inset-0",
  contentClassName = "relative z-10 pt-[env(safe-area-inset-top)] px-4 h-full flex flex-col justify-start pb-6",
}) => {
  // Ensure we start at the top when a page renders a NotchAreaHeader
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      // ignore
    }
  }, [imageUrl]);

  return (
    <div className={className}>
      <img src={imageUrl} alt={imageAlt} className={imageClassName} />
      <div
        className={`${gradientClassName} bg-gradient-${gradientDirection} ${gradientColorStops}`}
      />
      <div className={contentClassName}>{children}</div>
    </div>
  );
};

export default NotchAreaHeader;
