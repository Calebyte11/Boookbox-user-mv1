import React from "react";
import Posts from "@/components/Posts";
import SEO from "@/components/SEO";
import PostsReelsHeader from "@/components/PostsReelsHeader";

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
          name: "BoookBox Posts",
          description:
            "Explore posts, gifts, and engagements around the world.",
        }}
        ogImage="/pwa-192x192.png"
      />

      {/* Use shared header with segmented control */}
      <PostsReelsHeader />

      {/* Posts Feed */}
      <Posts />
    </>
  );
};

export default PostsPage;
