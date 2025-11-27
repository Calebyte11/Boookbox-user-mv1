import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangular",
  width,
  height,
  animate = true,
}) => {
  const baseClasses = "bg-gray-200";
  const animationClasses = animate ? "animate-pulse" : "";
  
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const styles: React.CSSProperties = {};
  if (width) styles.width = typeof width === "number" ? `${width}px` : width;
  if (height) styles.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={styles}
    />
  );
};

export default Skeleton;
