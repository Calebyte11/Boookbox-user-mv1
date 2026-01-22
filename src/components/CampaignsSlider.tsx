import React, { useState, useEffect,  useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/swiper-bundle.css";
import { useNavigate } from "react-router-dom";
import { useRecommendedCampaignsQuery } from "@/hooks/useCampaignQueries";
import { ListSkeleton } from "@/components/SkeletonLoader";
import type { Campaign } from "@/services/campaignService";
import { ArrowRight } from "lucide-react";
import { useLocationStore } from "@/store/locationStore";

interface CampaignsSliderProps {
  maxItems?: number;
}

const capitalizeWords = (str: string) => 
  str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

const CampaignsSlider: React.FC<CampaignsSliderProps> = ({ maxItems = 6 }) => {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);
    const locationStore = useLocationStore();

  // Resolve coordinates
    const coords = useMemo(() => {
      const manual = locationStore.manualLocation?.position;
      const gps = locationStore.position;
      if (manual?.latitude && manual?.longitude) {
        return { lat: manual.latitude, lng: manual.longitude } as const;
      }
      if (gps?.latitude && gps?.longitude) {
        return { lat: gps.latitude, lng: gps.longitude } as const;
      }
      return null;
    }, [locationStore.manualLocation, locationStore.position]);
    

  // Fetch top campaigns (doesn't require location)
  const {
    data: campaigns = [],
    isLoading,
    isError,
  } = useRecommendedCampaignsQuery(
    coords?.lat,
    coords?.lng,
    maxItems,
    1,
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">
            Events
          </h2>
        </div>
        <ListSkeleton count={6} />
      </div>
    );
  }

  // Handle error state
  if (isError || !campaigns || campaigns.length === 0) {
    return null;
  }

  // Handle campaign click - navigate to campaign dashboard
  const handleCampaignClick = (campaign: Campaign) => {
    navigate(
      `/campaigns/${campaign._id || campaign.id}`
    );
  };

  // Handle view all click
  const handleViewAll = () => {
    navigate("/campaigns");
  };

  if (!isMounted) return null;

  return (
    <div className="mb-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 ml-1 md:ml-0">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Campaigns
        </h2>
        <button
          onClick={handleViewAll}
          className="text-[#FF7A00] hover:text-[#ff6a00] font-semibold text-sm md:text-base transition-colors flex items-center gap-1"
        >
          View all
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Carousel */}
      <div className="relative w-full">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={16}
          slidesPerView={1}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 16,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={campaigns.length > 3}
          className="campaigns-swiper"
        >
          {campaigns.map((campaign) => (
            <SwiperSlide key={campaign._id || campaign.id}>
              <div
                onClick={() => handleCampaignClick(campaign)}
                className="group relative h-[280px] md:h-[300px] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
              >
                {/* Background Image */}
                <img
                  src={campaign.image || campaign.profileImage}
                  alt={campaign.name || campaign.title || "Campaign Image"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Campaign Info */}
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  {/* Business Name */}
                  <p className="text-xs md:text-sm font-semibold text-gray-200 mb-1 line-clamp-1">
                    {capitalizeWords(campaign.businessName || "Campaign")}
                  </p>

                  {/* Campaign Title */}
                  <h3 className="text-base md:text-lg font-bold text-white mb-2 line-clamp-2">
                    {capitalizeWords(campaign.name || campaign.title || "Featured Campaign")}
                  </h3>

                  {/* Campaign Details Row */}
                  <div className="flex items-center justify-between">
                    {/* Discount/Sales Info */}
                    <div className="flex items-center gap-2">
                      {campaign.discountPercentage && (
                        <span className="bg-[#FF7A00] text-white font-bold text-xs md:text-sm px-2 py-1 rounded-full">
                          {campaign.discountPercentage}% OFF
                        </span>
                      )}
                      {campaign.numberOfOrders && (
                        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                          {campaign.numberOfOrders} Orders
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Details Indicator */}
                <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm p-2 rounded-full group-hover:bg-[#FF7A00] transition-all duration-300">
                  <ArrowRight size={18} className="text-white" />
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Custom Styles */}
      <style>{`
        .campaigns-swiper .swiper-pagination-bullet {
          background: #d1d5db;
          opacity: 0.7;
        }
        .campaigns-swiper .swiper-pagination-bullet-active {
          background: #FF7A00;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default CampaignsSlider;
