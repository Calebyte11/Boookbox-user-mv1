import React from "react";
import SEO from "@/components/SEO";
import HeroCarousel from "@/components/Hero";
import Slider from "@/components/Slider";
import RecentGifting from "@/components/RecentGifting";
import Recomended from "@/components/Recomended";
import PopularPackages from "@/components/PopularPackages";
import { Container } from "@radix-ui/themes";
// import { useUserProfileQuery } from "@/hooks/useUserQueries"; 

const HomePage: React.FC = () => {
  // const { user } = useAuthStore();
  
  // const { data: rawProfileData } = useUserProfileQuery();
 
  // Regular home page content
  return (
    <Container size="4" className="mx-3">
      <SEO
        title="Home"
        description="order, gift, redeem package tickets and more around the world."
        keywords="packages gifting,  donations, social impact, restaurants and business stores, community support"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "BoookBox Home",
          description:
            "order, gift, redeem package tickets and more around the world.",
        }}
        ogImage="/pwa-192x192.png"
      />{" "}
      <div className="container mx-auto py-4">
        <div>
          <HeroCarousel />
        </div>
        <div className="flex justify-between items-center mt-4 ml-4">
          <Slider />
        </div>

        {/* Recent Gifting Section */}
        <div className="mb-8">
          <RecentGifting maxItems={8} />
        </div>

        <Recomended />
        <div>
          <PopularPackages />
        </div>
      </div>
    </Container>
  );
};

export default HomePage;
