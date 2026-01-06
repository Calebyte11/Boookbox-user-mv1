import {
  Gift,
  MapPin,
  Coffee,
  Star,
  Percent,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Slider = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lists = [
    {
      name: "Gift a Meal",
      icon: <Gift className="h-6 w-6 text-[#FF7A00]" />,
      link: "/restaurants/view-all",
    },
    {
      name: "Nearby",
      icon: <MapPin className="h-6 w-6 text-[#FF7A00]" />,
      link: "/tickets?filter=nearby",
    },
    {
      name: "Order for Self",
      icon: <Coffee className="h-6 w-6 text-[#FF7A00]" />,
      link: "/restaurants/view-all",
    },
    {
      name: "Special Meals",
      icon: <Sparkles className="h-6 w-6 text-[#FF7A00]" />,
      link: "/tickets/public/view-all?category=special",
    },
    {
      name: "Discounts",
      icon: <Percent className="h-6 w-6 text-[#FF7A00]" />,
      link: "/restaurants/view-all?filter=discounts",
    },
    {
      name: "Popular",
      icon: <Star className="h-6 w-6 text-[#FF7A00]" />,
      link: "/restaurants/view-all?filter=popular",
    },
    {
      name: "New Offers",
      icon: <TrendingUp className="h-6 w-6 text-[#FF7A00]" />,
      link: "/tickets/public/view-all?category=new",
    },
  ];

  return (
    <div className="relative w-full mt-6 z-0">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
        {(isExpanded ? lists : lists.slice(0, 6)).map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="flex items-center p-4 rounded-xl bg-[#FF7A00] gap-3 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <div className="p-3 bg-white rounded-lg shadow-xs flex-shrink-0">
              {item.icon}
            </div>
            <p className="text-sm md:text-base font-medium text-white font-mf">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
      {lists.length > 6 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 px-6 py-2 w-[50%] bg-gray-200 text-gray-700 font-medium rounded-lg hover:shadow-lg transition-all duration-300 w-full"
        >
          {isExpanded ? "See Less" : "See More"}
        </button>
      )}
    </div>
  );
};

export default Slider;
