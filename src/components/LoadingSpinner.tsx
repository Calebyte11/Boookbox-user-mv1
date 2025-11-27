import React from "react";

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
}) => {
  // Size mappings

  return (
    <div
      role="status"
      className="justify-center inline-flex gap-3 items-center h-screen w-full"
    >
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <span className="ml-2">{text}</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
