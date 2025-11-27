import React, { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

interface BackToTopProps {
  className?: string;
}

const BackToTop: React.FC<BackToTopProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={handleClick}
      className={`fixed bottom-[6rem] md:bottom-[2rem] right-8 z-50 bg-[#FF7A00] text-white p-3 rounded-full shadow-lg hover:bg-[#FF8A20] transition-colors flex items-center justify-center ${
        className || ""
      } `}
    >
      <ChevronUp className="h-6 w-6" />
    </button>
  );
};

export default BackToTop;
