import { Swiper, SwiperSlide } from "swiper/react";
import type { SwiperProps } from "swiper/react";
import { FreeMode, Navigation, Pagination } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/free-mode";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
import React from "react";

type SliderProps<T = unknown> = {
  data: T[];
  renderSlide: (item: T, index: number) => React.ReactNode;
  swiperProps?: SwiperProps;
  slideClassName?: string;
  containerClassName?: string;
};

const Reslider = <T,>({
  data,
  renderSlide,
  swiperProps = {
    modules: [FreeMode, Navigation, Pagination],
    spaceBetween: 16,
    slidesPerView: "auto",
    freeMode: true,
  },
  slideClassName = "!w-auto",
  containerClassName = "",
}: SliderProps<T>) => {
  return (
    <div className={`relative w-full ${containerClassName}`}>
      <Swiper {...swiperProps} className="w-full">
        {data.map((item, index) => (
          <SwiperSlide key={index} className={slideClassName}>
            {renderSlide(item, index)}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default Reslider;
