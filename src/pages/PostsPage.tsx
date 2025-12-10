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
      
      <div className="container mx-auto">
        {/* Posts Feed */}
        <Posts />
      </div>
    </Container>
  );
};

export default PostsPage;
