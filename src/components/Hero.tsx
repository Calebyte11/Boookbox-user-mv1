import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/swiper-bundle.css";
// import carouselImage from "/src/assets/images/image.jpg";
// import slider4 from "@/assets/images/slider1.jpg"
// import slider2 from "@/assets/images/slider2.jpg"
// import slider3 from "@/assets/images/slider3.jpg"
import slider1 from "@/assets/images/slider4.jpg"
import start from "@/assets/images/start.jpg"
import { useSpotlightImage, useSpotlightVideo } from "@/hooks/useSportlight";
import { useState, useRef, useEffect } from "react";
import { Play } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

// Video component with loading state and audio toggle
interface VideoWithLoadingProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  isActive?: boolean;
}

const VideoWithLoading = ({ src, className, isActive = true, ...props }: VideoWithLoadingProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayClick = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      videoRef.current.muted = newMuted;
      if (videoRef.current.paused) {
        videoRef.current.play();
      }
      // console.log('🎬 Video mute toggled:', newMuted ? 'muted' : 'unmuted');
    }
  };

  // Effect to handle video state when slide becomes inactive
  useEffect(() => {
    if (videoRef.current) {
      if (!isActive) {
        // Stop video and reset when slide goes out of focus
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
        videoRef.current.muted = true;
        setIsMuted(true);
        // console.log('🛑 Video stopped and reset (out of focus)');
      }
    }
  }, [isActive, isLoading, hasError]);

  return (
    <div className="relative h-full w-full">
      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 rounded-lg">
          <LoadingSpinner/>
        </div>
      )}
      
      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <span className="text-white">Video unavailable</span>
        </div>
      )}
      
      {/* Central Play/Mute button */}
      {!isLoading && !hasError && (
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 flex items-center justify-center z-10 transition-all duration-300"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted && <div className="bg-white/90 hover:bg-white p-4 rounded-full shadow-lg transition-all duration-200">
            <Play size={32} className="text-primary ml-1" />
          </div>}
        </button>
      )}
      
      <video
        ref={videoRef}
        src={src}
        className={`${className} ${(isLoading || hasError) ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        muted={isMuted}
        // controls={true}
        onLoadStart={() => {
          // console.log('Video load started:', src);
          setIsLoading(true);
          setHasError(false);
        }}
        onCanPlay={() => {
          // console.log('Video can play:', src);
          setIsLoading(false);
        }}
        onPlay={() => {
          // console.log('✅ Video started playing:', src);
        }}
        onPause={() => {
          // console.log('⏸️ Video paused:', src);
        }}
        onError={(e) => {
          const error = e.currentTarget.error;
          console.error('Video failed to load:', {
            src,
            error: error?.message || 'Unknown error',
            code: error?.code,
            networkState: e.currentTarget.networkState,
            readyState: e.currentTarget.readyState
          });
          setIsLoading(false);
          setHasError(true);
        }}
        {...props}
      />
    </div>
  );
};

const HeroCarousel = () => {
  const { data: spotlightVideo, isLoading: videoLoading, error: videoError } = useSpotlightVideo();
  const { data: spotlightImage, isLoading: imageLoading, error: imageError } = useSpotlightImage();
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Debug logging - can be removed in production
  if (videoError) console.error('Video loading error:', videoError);
  if (imageError) console.error('Image loading error:', imageError);
  
  // if (spotlightVideo?.url) {
  //   // console.log('✅ Spotlight video loaded:', spotlightVideo.url);
  // }
  // if (spotlightImage?.url) {
  //   console.log('✅ Spotlight image loaded:', spotlightImage.url);
  // }

  // Static carousel images as fallback
  const staticCarouselImages = [
    start,
    slider1,
    // slider2,
    // slider3,
    // slider4,
  ];

  // Static carousel titles
  const carouselTitles = [
    "Unbox joy everywhere",
    "Unbox joy in different places", 
    // "Unbox joy today",
    // "Unbox Joy Now",
    // "Bring your favourite Kitchen on BookBox"
  ];

  // Helper function to validate video URL
  const isValidVideoUrl = (url: string) => {
    if (!url) return false;
    // Check for common video extensions or streaming URLs
    const videoExtensions = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;
    const streamingUrls = /^https?:\/\/.+/i;
    return videoExtensions.test(url) || streamingUrls.test(url);
  };

  // Build dynamic carousel items combining static and spotlight content
  const buildCarouselItems = () => {
    const items = [];
    
    try {
      // Add spotlight video with validation
      if (spotlightVideo && !videoLoading && !videoError && spotlightVideo.url) {
        if (isValidVideoUrl(spotlightVideo.url)) {
          items.push({
            type: 'video' as const,
            src: spotlightVideo.url,
            title: "",
            isSpotlight: true
          });
        } 
        // else {
        //   console.warn('❌ Invalid video URL detected:', spotlightVideo.url);
        // }
      }
      
      // Add spotlight image
      if (spotlightImage && !imageLoading && !imageError && spotlightImage.url) {
        items.push({
          type: 'image' as const,
          src: spotlightImage.url,
          title: "",
          isSpotlight: true
        });
      }
    } catch (error) {
      console.warn('Error loading spotlight content:', error);
      // Continue with static content only
    }
    
    // Always add static images as fallback
    staticCarouselImages.forEach((image, index) => {
      items.push({
        type: 'image' as const,
        src: image,
        title: carouselTitles[index] || "Unbox joy with BoookBox",
        isSpotlight: false
      });
    });
    
    return items;
  };

  const carouselItems = buildCarouselItems();

  // Show loading state if still fetching spotlight content
  const isLoading = videoLoading || imageLoading;

  return (
    <div className="relative w-full z-0">
      {/* Show loading indicator if needed */}
      {isLoading && (
        <div className="absolute top-4 right-4 z-10">
          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
      
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        // autoplay={{
        //   delay: 5000,
        //   disableOnInteraction: false,
        // }}
        pagination={{
          clickable: true,
          el: ".custom-pagination",
          bulletClass: "swiper-pagination-bullet !bg-gray-300 !opacity-100 ",
          bulletActiveClass: "!bg-primary !w-3 !h-3",
        }}
        loop={true}
        className="h-[300px] md:h-[500px] w-full"
        onSlideChange={(swiper) => {
          setActiveSlideIndex(swiper.realIndex);
          // console.log('Slide changed to index:', swiper.realIndex);
        }}
        onSwiper={(swiper) => {
          setActiveSlideIndex(swiper.realIndex);
        }}
      >
        {carouselItems.map((item, index) => (
          <SwiperSlide key={`${item.type}-${index}`}>
            <div className="relative h-full w-full lg:flex lg:items-center lg:justify-center">
              {item.type === 'video' ? (
                <VideoWithLoading
                  src={item.src}
                  className="h-full w-full lg:object-fill rounded-lg"
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  preload="metadata"
                  webkit-playsinline="true"
                  isActive={activeSlideIndex === index}
                  // onStalled={() => console.warn('⚠️ Video stalled (network issue):', item.src)}
                  // onSuspend={() => console.log('ℹ️ Video loading paused (normal behavior):', item.src)}
                  // onWaiting={() => console.log('⏳ Video buffering:', item.src)}
                />
              ) : (
                <img
                  src={item.src}
                  alt={`Hero ${item.type} ${index + 1}`}
                  className="h-full w-full lg:object-fill rounded-lg"
                  // onError={() => {
                  //   console.warn('Image failed to load:', item.src);
                  //   // Fallback is handled by keeping static images always available
                  // }}
                />
              )}
              <div className="absolute inset-0 lg:bg-black/20 flex items-center justify-center rounded-lg h-full p-6">
                <h2 className="text-white text-2xl md:text-4xl font-bold text-pretty mt-[10rem]">
                  {item.title}
                </h2>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom pagination container - positioned below the swiper */}
      <div className="custom-pagination mt-4 flex justify-center gap-6">
        {/* Dynamic pagination bullets based on actual slide count */}
        {carouselItems.map((_, index) => (
          <div key={index} className="swiper-pagination-bullet"></div>
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
