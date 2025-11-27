import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import SEO from "@/components/SEO";
import HeroCarousel from "@/components/Hero";
import Slider from "@/components/Slider";
import RecentGifting from "@/components/RecentGifting";
import Recomended from "@/components/Recomended";
import PopularPackages from "@/components/PopularPackages";
import Posts from "@/components/Posts";
import { Container, SegmentedControl } from "@radix-ui/themes";
// import { useUserProfileQuery } from "@/hooks/useUserQueries"; 

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const location = useLocation();
  // const { user } = useAuthStore();
  
  // const { data: rawProfileData } = useUserProfileQuery();
  // Initialize activeTab based on URL parameter or default to "recent-gifting"
  const [activeTab, setActiveTab] = useState(() => {
    if (tab === "posts") return "posts";
    if (tab === "recent-gifting") return "recent-gifting";
    return "recent-gifting";
  });

  // Scroll position preservation
  const scrollPositions = useRef<{ [key: string]: number }>({});
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update URL when tab changes
  useEffect(() => {
    const currentPath = location.pathname;
    const newPath = activeTab === "recent-gifting" 
      ? "/home" 
      : `/home/${activeTab}`;
    
    // Only navigate if the path is different to avoid infinite loops
    if (currentPath !== newPath) {
      navigate(newPath, { replace: true });
    }
  }, [activeTab, navigate, location.pathname]);

  // Handle segment control changes with scroll position preservation
  const handleTabChange = (value: string) => {
    // Save current scroll position before switching
    scrollPositions.current[activeTab] = window.scrollY;
    
    setIsTransitioning(true);
    setActiveTab(value);
    
    // Restore scroll position after a brief delay to allow component to render
    setTimeout(() => {
      const savedPosition = scrollPositions.current[value] || 0;
      window.scrollTo({ 
        top: savedPosition, 
        behavior: 'auto' // Use 'auto' to prevent additional smooth scrolling
      });
      setIsTransitioning(false);
    }, 50); // Brief delay to ensure DOM is ready
  };
 
  // Regular home page content
  return (
    <Container size="4" className="mx-3">
      <SEO
        title="Home"
        description="order, gift, redeem meal tickets and more around the world."
        keywords="meal gifting, food donation, social impact, restaurants, community support"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "BoookBox Home",
          description:
            "order, gift, redeem meal tickets and more around the world.",
        }}
        ogImage="/pwa-192x192.png"
      />{" "}
      <div className="container mx-auto py-4">
        <div >
          <HeroCarousel />
        </div>
        <div className="flex justify-between items-center mt-4 ml-4">
          <Slider />
        </div>

        {/* Segmented Control for Recent Gifting and Posts */}
        <div className="mt-[4rem] mb-6 flex justify-end w-full">
          <SegmentedControl.Root
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full max-w-md mx-auto"
          >
            <SegmentedControl.Item value="recent-gifting" className="flex-1 text-center">
              Recent Gifting
            </SegmentedControl.Item>
            <SegmentedControl.Item value="posts" className="flex-1 text-center">
              Community Posts
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>

        {/* Content based on active tab with smooth transitions */}
        <div className="mb-8 relative">
          {/* Recent Gifting Tab */}
          <div 
            className={`transition-all duration-300 ${
              activeTab === "recent-gifting" 
                ? "opacity-100 visible" 
                : "opacity-0 invisible absolute inset-0 pointer-events-none"
            } ${isTransitioning ? "pointer-events-none" : ""}`}
          >
            <RecentGifting maxItems={8} />
          </div>
          
          {/* Community Posts Tab */}
          <div 
            className={`transition-all duration-300 ${
              activeTab === "posts" 
                ? "opacity-100 visible" 
                : "opacity-0 invisible absolute inset-0 pointer-events-none"
            } ${isTransitioning ? "pointer-events-none" : ""}`}
          >
            <Posts />
          </div>
        </div>

        <Recomended />
        <div >
          <PopularPackages />
          
        </div>{" "}
      </div>
    </Container>
  );
};

export default HomePage;
