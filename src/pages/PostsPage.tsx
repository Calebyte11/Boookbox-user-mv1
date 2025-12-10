import React from "react";
import Posts from "@/components/Posts";
import SEO from "@/components/SEO";

const PostsPage: React.FC = () => {

  return (
    <>
      <SEO
        title="Community Posts"
        description="Explore community posts, gifts, and engagements around the world."
        keywords="community posts, gifting, donations, social engagement, restaurants and business stores"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "BoookBox Community Posts",
          description:
            "Explore community posts, gifts, and engagements around the world.",
        }}
        ogImage="/pwa-192x192.png"
      />
      
      {/* Page Header */}
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-gray-200">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Community Posts</h1>
        <p className="text-gray-600 text-sm md:text-base mt-1">
          Discover what others are sharing in the community
        </p>
      </div>
      
      {/* Posts Feed */}
      <Posts />
    </>
  );
};

export default PostsPage;
