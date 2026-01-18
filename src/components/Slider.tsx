import {
  Gift,
  Coffee,
  Star,
  Percent,
  Sparkles,
  Calendar,
  MoreHorizontal,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  link: string;
  onClick?: () => void;
}

const Slider = () => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const mainItems: MenuItem[] = [
    {
      name: "Gifts",
      icon: <Gift className="h-5 w-5 text-white" />,
      link: "/restaurants/view-all",
    },
    {
      name: "Events",
      icon: <Calendar className="h-5 w-5 text-white" />,
      link: "/campaigns",
      onClick: () => navigate("/campaigns"),
    },
    {
      name: "Order for Self",
      icon: <Coffee className="h-5 w-5 text-white" />,
      link: "/restaurants/view-all",
    },
    {
      name: "Nearby",
      icon: <MapPin className="h-5 w-5 text-white" />,
      link: "/tickets?filter=nearby",
    },
    {
      name: "Popular",
      icon: <Star className="h-5 w-5 text-white" />,
      link: "/restaurants/view-all?filter=popular",
    },
  ];

  const additionalItems: MenuItem[] = [
    
    {
      name: "Special Meals",
      icon: <Sparkles className="h-5 w-5 text-white" />,
      link: "/tickets/public/view-all?category=special",
    },
    {
      name: "New Offers",
      icon: <TrendingUp className="h-5 w-5 text-white" />,
      link: "/tickets/public/view-all?category=new",
    },
    {
      name: "Discounts",
      icon: <Percent className="h-5 w-5 text-white" />,
      link: "/restaurants/view-all?filter=discounts",
    },
  ];

  const allItems = isExpanded ? [...mainItems, ...additionalItems] : mainItems;
  const showMoreButton = !isExpanded;

  return (
    <div className="relative w-full mt-2 mb-2 z-0">
      {/* Main Menu Grid */}
      <div className="bg-[#FF7A00] rounded-3xl p-3 PT-1 md:p-8 shadow-lg">
        <div className="grid grid-cols-2 gap-0 md:gap-0">
          {allItems.map((item, index) => {
            const isLeftColumn = index % 2 === 0;
            const isLastRow = Math.floor(index / 2) === Math.ceil(allItems.length / 2) - 1;
            
            return (
            <button
              key={index}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else {
                  navigate(item.link);
                }
              }}
              className={`flex items-center gap-3 p-4 text-white font-semibold text-sm md:text-base transition-all duration-300 hover:opacity-90 cursor-pointer ${
                isLeftColumn ? 'border-r' : ''
              } ${!isLastRow ? 'border-b' : ''} border-[#00000030]`}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="text-left">{item.name}</span>
            </button>
            );
          })}

          {/* More/Less Button */}
          {showMoreButton && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-3 p-4 text-white font-semibold text-sm md:text-base transition-all duration-300 hover:opacity-90 col-span-1 border-gray-600"
            >
              <div className="shrink-0">
                <MoreHorizontal className="h-5 w-5 text-white" />
              </div>
              <span className="text-left">More</span>
            </button>
          )}

          {/* See Less Button (shown when expanded) */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-3 p-4 text-white font-semibold text-sm md:text-base transition-all duration-300 hover:opacity-90 col-span-2 md:col-span-1 justify-center border-t border-[#00000030]"
            >
              <span>See Less</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Slider;
