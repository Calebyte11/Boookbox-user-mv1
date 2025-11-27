import {
  Gift,
  MapPin,
  Coffee,
  Star,
  Percent,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { Link } from "react-router-dom";
// import "swiper/swiper-bundle.css"

const Slider = () => {
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
      <Swiper
        spaceBetween={16}
        modules={[FreeMode]}
        slidesPerView={"auto"}
        freeMode={true}
        breakpoints={{
          640: {
            spaceBetween: 20,
          },
          1024: {
            spaceBetween: 24,
          },
        }}
        className="category-swiper w-full"
      >
        {lists.map((item, index) => (
          <SwiperSlide key={index} className="!w-auto h-[5.5rem] md:h-[6rem]">
            <Link
              to={item.link}
              className={`flex items-center p-4 rounded-xl bg-[#FF7A00] gap-3 shadow-sm hover:shadow-lg transition-all duration-300 h-full cursor-pointer`}
            >
              <div className="p-3 bg-white rounded-lg shadow-xs flex-shrink-0">
                {item.icon}
              </div>
              <p className="text-sm md:text-base font-medium text-white whitespace-nowrap font-mf">
                {item.name}
              </p>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Slider;
