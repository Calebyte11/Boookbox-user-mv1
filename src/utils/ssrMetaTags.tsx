// // import { Post } from '../types/post'; // Assuming Post type is defined in types/post.ts

// import type { Post } from "@/types/post";
// import type { Clip } from "@/types/reel";
// import logo from '/pwa-192x192.png';

// const trimTrailingSlash = (value: string) => value.replace(/\/+$|^\/+/, "");

// const PUBLIC_APP_URL = (() => {
//   const envValue = import.meta.env.VITE_PUBLIC_APP_URL as string | "boookbox.com";
//   if (!envValue) return "";
//   return trimTrailingSlash(envValue.trim());
// })();

// const toAbsoluteUrl = (value?: string | null): string | undefined => {
//   if (!value) return undefined;
//   const trimmed = value.trim();
//   if (!trimmed) return undefined;

//   if (/^(?:https?:|data:|blob:|mailto:|tel:|sms:)/i.test(trimmed)) {
//     return trimmed;
//   }

//   if (trimmed.startsWith("//")) {
//     return `https:${trimmed}`;
//   }

//   const baseForRelative = PUBLIC_APP_URL;
//   if (baseForRelative) {
//     try {
//       return new URL(trimmed, `${baseForRelative}/`).toString();
//     } catch {
//       if (trimmed.startsWith("/")) {
//         return `${baseForRelative}${trimmed}`;
//       }
//       return `${baseForRelative}/${trimmed}`;
//     }
//   }

//   if (trimmed.startsWith("/")) {
//     return trimmed;
//   }

//   return `/${trimmed}`;
// };

// export const generateSsrMetaTags = (post: Post) => {
//   const siteTitle = "BoookBox";
//   const fullTitle = post.title ? `${post.title} | ${siteTitle}` : siteTitle;
//   const description =
//     post.message ||
//     "order, gift, redeem meal tickets and more around the world";
//   // Provide a default image URL if the post has no images.
//   const imageUrl = post.data?.resource?.customImage || post.images?.[0] || logo;
  
//   const absoluteOgImage = toAbsoluteUrl(imageUrl) ?? logo;

//   return {
//     title: fullTitle,
//     description,
//     og: {
//       title: fullTitle,
//       description,
//       type: "article",
//       url: `${PUBLIC_APP_URL}/post/${post._id}`,
//       image: absoluteOgImage,
//       site_name: siteTitle,
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: fullTitle,
//       description,
//       image: absoluteOgImage,
//     },
//   };
// };

// export const generateSsrReelMetaTags = (reel: Clip) => {
//   const siteTitle = "BoookBox";
//   const fullTitle = reel.title
//     ? `${reel.title} | ${siteTitle}`
//     : `Reel by ${reel.uploader?.id?.fullName ?? "a user"} | ${siteTitle}`;
//   const description =
//     reel.subtitle ||
//     reel.title ||
//     "Watch this reel on BoookBox";
//   const imageUrl = reel.thumbnail || logo;
//   const videoUrl = reel.videoUrl;

//   const absoluteOgImage =
//     toAbsoluteUrl(imageUrl) ?? logo;
//   const absoluteOgVideo = toAbsoluteUrl(videoUrl);

//   return {
//     title: fullTitle,
//     description,
//     og: {
//       title: fullTitle,
//       description,
//       type: "video.other",
//       url: `${PUBLIC_APP_URL}/reel/${reel._id}`,
//       image: absoluteOgImage,
//       video: absoluteOgVideo,
//       site_name: siteTitle,
//     },
//     twitter: {
//       card: "player",
//       title: fullTitle,
//       description,
//       image: absoluteOgImage,
//       player: absoluteOgVideo,
//     },
//   };
// };

// export const generateSsrStaticMetaTags = (meta: { title: string; description: string }, url: string) => {
//   const pageUrl = `${PUBLIC_APP_URL}${url}`;
//   const imageUrl = logo || `${PUBLIC_APP_URL}/pwa-192x192.png`;

//   return {
//     title: meta.title,
//     description: meta.description,
//     og: {
//       title: meta.title,
//       description: meta.description,
//       url: pageUrl,
//       image: imageUrl,
//       type: "website",
//       site_name: "BoookBox",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: meta.title,
//       description: meta.description,
//       image: imageUrl,
//     },
//   };
// };
// export const generateSsrReferralMetaTags = (url: string) => {
//   const title = "Join me on BoookBox!";
//   const description = "Sign up using my referral link and let's connect on BoookBox. Gift and redeem meal tickets globally.";
//   const imageUrl = logo || `${PUBLIC_APP_URL}/pwa-192x192.png`;
//   const pageUrl = `${PUBLIC_APP_URL}${url}`;

//   return {
//     title,
//     description,
//     og: {
//       title,
//       description,
//       url: pageUrl,
//       image: imageUrl,
//       type: "website",
//       site_name: "BoookBox",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title,
//       description,
//       image: imageUrl,
//     },
//   };
// };



// ssrMetaTags.tsx

import type { Post } from "@/types/post";
import type { Clip } from "@/types/reel";
import type { GiftRequestDataPublic } from "@/services/giftRequestService";
import logo from '/pwa-192x192.png';
// import { image } from "html2canvas/dist/types/css/types/image";

const trimTrailingSlash = (value: string) => value.replace(/\/+$|^\/+/, "");

const PUBLIC_APP_URL = (() => {
  const envValue = import.meta.env.VITE_PUBLIC_APP_URL as string | "boookbox.com";
  if (!envValue) return "";
  return trimTrailingSlash(envValue.trim());
})();

const toAbsoluteUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (/^(?:https?:|data:|blob:|mailto:|tel:|sms:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  const baseForRelative = PUBLIC_APP_URL;
  if (baseForRelative) {
    try {
      return new URL(trimmed, `${baseForRelative}/`).toString();
    } catch {
      if (trimmed.startsWith("/")) {
        return `${baseForRelative}${trimmed}`;
      }
      return `${baseForRelative}/${trimmed}`;
    }
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
};

export const generateSsrMetaTags = (post: Post) => {
  const siteTitle = "BoookBox";
  const fullTitle = post.title ? `${post.title} | ${siteTitle}` : siteTitle;
  const description =
    post.message ||
    "order, gift, request and redeem package tickets and more around the world";
  const imageUrl = post.data?.resource?.customImage || post.images?.[0] || logo;
  
  const absoluteOgImage = toAbsoluteUrl(imageUrl) ?? logo;
  
  // Escape special characters for HTML attributes
  const escapedTitle = escapeHtml(fullTitle);
  const escapedDescription = escapeHtml(description);

  return {
    title: escapedTitle,
    description: escapedDescription,
    og: {
      title: escapedTitle,
      description: escapedDescription,
      type: "article",
      url: `${PUBLIC_APP_URL}/post/${post._id}`,
      image: absoluteOgImage,
      site_name: siteTitle,
    },
    twitter: {
      card: "summary_large_image",
      title: escapedTitle,
      description: escapedDescription,
      image: absoluteOgImage,
    },
  };
};

export const generateSsrReelMetaTags = (reel: Clip) => {
  const siteTitle = "BoookBox";
  const fullTitle = reel.title
    ? `${reel.title} | ${siteTitle}`
    : `Reel by ${reel.uploader?.id?.fullName ?? "a user"} | ${siteTitle}`;
  const description =
    reel.subtitle ||
    reel.title ||
    "Watch this reel on BoookBox";
  const imageUrl = reel.thumbnail || logo;
  const videoUrl = reel.videoUrl;

  const absoluteOgImage =
    toAbsoluteUrl(imageUrl) ?? logo;
  const absoluteOgVideo = toAbsoluteUrl(videoUrl);

  // Escape special characters for HTML attributes
  const escapedTitle = escapeHtml(fullTitle);
  const escapedDescription = escapeHtml(description);

  return {
    title: escapedTitle,
    description: escapedDescription,
    og: {
      title: escapedTitle,
      description: escapedDescription,
      type: "video.other",
      url: `${PUBLIC_APP_URL}/reel/${reel._id}`,
      image: absoluteOgImage,
      video: absoluteOgVideo,
      site_name: siteTitle,
    },
    twitter: {
      card: "player",
      title: escapedTitle,
      description: escapedDescription,
      image: absoluteOgImage,
      player: absoluteOgVideo,
    },
  };
};

export const generateSsrStaticMetaTags = (meta: { title: string; description: string }, url: string) => {
  const pageUrl = `${PUBLIC_APP_URL}${url}`;
  const imageUrl = logo || `${PUBLIC_APP_URL}/pwa-192x192.png`;

  // Escape special characters for HTML attributes
  const escapedTitle = escapeHtml(meta.title);
  const escapedDescription = escapeHtml(meta.description);

  return {
    title: escapedTitle,
    description: escapedDescription,
    og: {
      title: escapedTitle,
      description: escapedDescription,
      url: pageUrl,
      image: imageUrl,
      type: "website",
      site_name: "BoookBox",
    },
    twitter: {
      card: "summary_large_image",
      title: escapedTitle,
      description: escapedDescription,
      image: imageUrl,
    },
  };
};

// Helper function to escape special characters for HTML attributes
const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

export const generateSsrReferralMetaTags = (
  // url: string
) => {
  const title = "Join me on BoookBox!";
  const description = "Sign up using my referral link and let's connect on BoookBox. Gift and redeem package tickets globally.";
  const imageUrl = logo || `${PUBLIC_APP_URL}/pwa-192x192.png`;
  const pageUrl = `${PUBLIC_APP_URL}/auth/signup`;
  const absoluteOgImage = toAbsoluteUrl(imageUrl) ?? logo;

  // Escape special characters for HTML attributes
  const escapedTitle = escapeHtml(title);
  const escapedDescription = escapeHtml(description);

  return {
    title: escapedTitle,
    description: escapedDescription,
    og: {
      title: escapedTitle,
      description: escapedDescription,
      url: pageUrl,
      image: absoluteOgImage,
      type: "website",
      site_name: "BoookBox",
    },
    twitter: {
      card: "summary_large_image",
      title: escapedTitle,
      description: escapedDescription,
      image: absoluteOgImage,
    },
  };
};

//  NEW: Gift Request Meta Tags Generator
export const generateSsrGiftRequestMetaTags = (giftRequest: GiftRequestDataPublic) => {
  const siteTitle = "BoookBox";
  const productName = giftRequest.product.name;
  const businessName = giftRequest.business.name;
 const recipientName = giftRequest.user.accountType === "organization" 
  ? giftRequest.user.organizationName 
  : giftRequest.user.fullName;
  // Create engaging title
  const fullTitle = `Gift Request: ${productName} for ${recipientName} from ${businessName} | ${siteTitle}`;
  
  // Create descriptive text
  const description = giftRequest.product.description
    ? `${giftRequest.product.description} - Help fulfill this gift request for ${recipientName} from ${businessName} on BoookBox`
    : `Help fulfill this gift request for ${recipientName} from ${businessName}. Gift and redeem meal tickets globally on BoookBox.`;
  
  // Get the best image (product first, then business logo)
  const imageUrl = giftRequest.product.images?.[0] || giftRequest.business.profileImage || logo;
  const absoluteOgImage = toAbsoluteUrl(imageUrl) ?? logo;
  
  // Construct the page URL
  const pageUrl = `${PUBLIC_APP_URL}/gifting/requests/r/${giftRequest._id}`;

  // Escape special characters for HTML attributes
  const escapedTitle = escapeHtml(fullTitle);
  const escapedDescription = escapeHtml(description);

  return {
    title: escapedTitle,
    description: escapedDescription,
    og: {
      title: escapedTitle,
      description: escapedDescription,
      type: "website",
      url: pageUrl,
      image: absoluteOgImage,
      site_name: siteTitle,
    },
    twitter: {
      card: "summary_large_image",
      title: escapedTitle,
      description: escapedDescription,
      image: absoluteOgImage,
    },
  };
};