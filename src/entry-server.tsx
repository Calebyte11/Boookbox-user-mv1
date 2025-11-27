/* eslint-disable @typescript-eslint/no-explicit-any */

import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider } from "react-helmet-async";
import { postService } from "./services/postService"; // Assuming you have a reelService
import { clipService } from "./services/ReelService"; // Assuming this path
import {
  generateSsrMetaTags,
  generateSsrReelMetaTags,
  generateSsrStaticMetaTags,
  generateSsrReferralMetaTags,
} from "./utils/ssrMetaTags";
import type { Post } from "./types/post"; // Assuming you have a Reel type
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Dynamically import App to allow for client-side component mocking
const App = (await import("./App")).default;

const staticPageMeta = {
  "/": {
    title:
      "BoookBox - order, gift, redeem meal tickets and more around the world",
    description:
      "Discover and gift meal tickets from restaurants worldwide. Join BoookBox to share the joy of food with friends and family, no matter where they are.",
  },
  "/terms-of-service": {
    title: "Terms of Service - BoookBox",
    description:
      "Please read these Terms of Service carefully before using the BoookBox platform. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.",
  },
  "/privacy-policy": {
    title: "Privacy Policy - BoookBox",
    description:
      "This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.",
  },
  "/about-us": {
    title: "About Us - BoookBox",
    description:
      "BoookBox is a global meal gifting platform that connects people through the love of food. Our mission is to make it easy for anyone to send a thoughtful and delicious gift to their loved ones, no matter the distance.",
  },
  "/auth": {
    title: "Welcome to BoookBox - Sign In or Create Your Account",
    description:
      "Join BoookBox to start gifting meal tickets to your friends and family, anywhere in the world. A world of flavor is just a click away.",
  },
};

export async function render(url: string) {
  const queryClient = new QueryClient();
  const helmetContext: { helmet?: any } = {};
  let appHtml = "";
  let metaTags = "";

  const isReferral =
    url.startsWith("/auth/signup") && url.includes("referralCode=");
  // Match /post/:id, /p/:id, or /reel/:id
  const ssrMatch = url.match(/^\/(post|p|reel)\/([a-zA-Z0-9]+)$/);

  let meta;
  if (url.startsWith("/auth/")) {
    meta = staticPageMeta["/auth"];
  } else {
    meta = staticPageMeta[url as keyof typeof staticPageMeta];
  }

  if (isReferral) {
    const tags = generateSsrReferralMetaTags(url);
    // console.log("metaTags",tags);
    metaTags = `
      <title>${tags.title}</title>
              <meta name="description" content="${tags.description}" />
              <meta property="og:title" content="${tags.og.title}" />
              <meta property="og:description" content="${tags.og.description}" />
              <meta property="og:type" content="${tags.og.type}" />
              <meta property="og:url" content="${tags.og.url}" />
              <meta property="og:image" content="${tags.og.image}" />
              <meta property="og:site_name" content="${tags.og.site_name}" />
              <meta name="twitter:card" content="${tags.twitter.card}" />
              <meta name="twitter:title" content="${tags.twitter.title}" />
              <meta name="twitter:description" content="${tags.twitter.description}" />
              <meta name="twitter:image" content="${tags.twitter.image}" />
    `;
  } else if (ssrMatch) {
    try {
      const [, routeType, entityId] = ssrMatch;
      let tags;

      if (routeType === "post" || routeType === "p") {
        const post = await postService.getPostByIdPublic(entityId);
        tags = generateSsrMetaTags(post as Post);
        metaTags = `
              <title>${tags.title}</title>
              <meta name="description" content="${tags.description}" />
              <meta property="og:title" content="${tags.og.title}" />
              <meta property="og:description" content="${tags.og.description}" />
              <meta property="og:type" content="${tags.og.type}" />
              <meta property="og:url" content="${tags.og.url}" />
              <meta property="og:image" content="${tags.og.image}" />
              <meta property="og:site_name" content="${tags.og.site_name}" />
              <meta name="twitter:card" content="${tags.twitter.card}" />
              <meta name="twitter:title" content="${tags.twitter.title}" />
              <meta name="twitter:description" content="${tags.twitter.description}" />
              <meta name="twitter:image" content="${tags.twitter.image}" />
            `;
      } else if (routeType === "reel") {
        const reel = await clipService.getClipByIdPublic(entityId);
        tags = generateSsrReelMetaTags(reel as any);

        metaTags = `
              <title>${tags.title}</title>
              <meta name="description" content="${tags.description}" />
              <meta property="og:title" content="${tags.og.title}" />
              <meta property="og:description" content="${tags.og.description}" />
              <meta property="og:type" content="${tags.og.type}" />
              <meta property="og:url" content="${tags.og.url}" />
              <meta property="og:image" content="${tags.og.image}" />
              <meta property="og:video" content="${tags.og.video}" />
              <meta property="og:site_name" content="${tags.og.site_name}" />
              <meta name="twitter:card" content="${tags.twitter.card}" />
              <meta name="twitter:title" content="${tags.twitter.title}" />
              <meta name="twitter:description" content="${tags.twitter.description}" />
              <meta name="twitter:image" content="${tags.twitter.image}" />
              <meta name="twitter:player" content="${tags.twitter.player}" />
            `;
      }
    } catch (error) {
      console.error(`Failed to fetch ${ssrMatch[1]} data for SSR`, error);
    }
  } else if (meta) {
    const tags = generateSsrStaticMetaTags(meta, url);
    console.log("metaTags",meta, url);
    metaTags = `
      <title>${tags.title}</title>
      <meta name="description" content="${tags.description}" />
      <meta property="og:title" content="${tags.og.title}" />
      <meta property="og:description" content="${tags.og.description}" />
      <meta property="og:url" content="${tags.og.url}" />
      <meta property="og:image" content="${tags.og.image}" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="BoookBox" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content="${tags.twitter.title}" />
      <meta name="twitter:description" content="${tags.twitter.description}" />
      <meta name="twitter:image" content="${tags.twitter.image}" />
    `;
  }

  appHtml = renderToString(
    <QueryClientProvider client={queryClient}>
      <HelmetProvider context={helmetContext}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );

  const { helmet } = helmetContext;
  const head =
    metaTags + (helmet ? helmet.title.toString() + helmet.meta.toString() : "");

  return { head, html: appHtml };
}
