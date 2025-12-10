import React from "react";
import Posts from "@/components/Posts";
import { Container } from "@radix-ui/themes";
import SEO from "@/components/SEO";

const PostsPage: React.FC = () => {

  return (
    <Container size="4" className="mx-3">
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
      
      <div className="container mx-auto py-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Community Posts</h1>
          <p className="text-gray-600 text-sm mt-1">
            Discover what others are sharing in the community
          </p>
        </div>

        {/* Posts Feed */}
        <Posts />
      </div>
    </Container>
  );
};

export default PostsPage;
