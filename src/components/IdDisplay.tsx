import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface IdDisplayProps {
  id: string;
  label?: string;
  maxLength?: number;
  className?: string;
}

const IdDisplay: React.FC<IdDisplayProps> = ({
  id,
  label = "ID",
  maxLength = 8,
  className = "",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const shouldShorten = id.length > maxLength;
  const displayId =
    isRevealed || !shouldShorten ? id : `${id.slice(0, maxLength)}...`;

  const toggleReveal = () => {
    setIsRevealed(!isRevealed);
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">
        {label}: {displayId}
      </span>
      {shouldShorten && (
        <button
          onClick={toggleReveal}
          className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
          title={isRevealed ? "Hide full ID" : "Show full ID"}
        >
          {isRevealed ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};

export default IdDisplay;
