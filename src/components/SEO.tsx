import { Helmet } from "react-helmet-async";

const trimTrailingSlash = (value: string) => value.replace(/\/+$|^\/+/, "");

const PUBLIC_APP_URL = (() => {
  const envValue = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined; 
  if (!envValue) return "";
  return trimTrailingSlash(envValue.trim());
})();

interface OpenGraphProps {
  title?: string;
  description?: string;
  image?: string | string[];
  url?: string;
  type?: "website" | "article" | "book" | "profile";
  siteName?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "book" | "profile";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  keywords?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
  openGraph?: OpenGraphProps;
  children?: React.ReactNode;
}
/**
 * SEO component for managing document head metadata
 *
 * This component uses react-helmet-async to update document head
 * with SEO-relevant tags including title, description, Open Graph tags,
 * Twitter Card tags, canonical URLs, and JSON-LD structured data.
 */
const SEO = ({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  twitterCard = "summary_large_image",
  keywords = "meal gifting, social impact, restaurants, food donations, community support",
  noIndex = false,
  structuredData,
  openGraph,
  children,
}: SEOProps) => {
  const siteTitle = "BoookBox";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const hasWindow = typeof window !== "undefined" && typeof window.location !== "undefined";
  const runtimeOrigin = hasWindow ? window.location.origin : "";
  const runtimeHref = hasWindow ? window.location.href : "";
  const runtimeProtocol = hasWindow ? window.location.protocol : "https:";
  const fallbackBaseUrl = runtimeOrigin || PUBLIC_APP_URL;
  const normalizedBaseUrl = fallbackBaseUrl ? trimTrailingSlash(fallbackBaseUrl) : "";

  const toAbsoluteUrl = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    if (/^(?:https?:|data:|blob:|mailto:|tel:|sms:)/i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith("//")) {
      return `${runtimeProtocol}${trimmed}`;
    }

    const baseForRelative = normalizedBaseUrl || runtimeOrigin || PUBLIC_APP_URL;
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

  const canonicalUrl = toAbsoluteUrl(canonical) || runtimeHref || (normalizedBaseUrl ? `${normalizedBaseUrl}/` : "/");
  const currentUrl = canonicalUrl;
  
  // Use openGraph values if provided, otherwise fall back to defaults
  const ogTitle = openGraph?.title || fullTitle;
  const ogDescription = openGraph?.description || description;
  const ogImageCandidates = Array.isArray(openGraph?.image)
    ? (openGraph?.image as string[])
    : [openGraph?.image];
  const processedOgImages = [...ogImageCandidates, ogImage]
    .filter((img): img is string => typeof img === "string" && img.trim().length > 0)
    .map((img) => toAbsoluteUrl(img) || img)
    .filter((img, index, array) => typeof img === "string" && array.indexOf(img) === index);
  const absoluteOgImage = processedOgImages[0];
  const ogUrl = toAbsoluteUrl(openGraph?.url) || currentUrl;
  const ogTypeValue = openGraph?.type || ogType;
  const ogSiteName = openGraph?.siteName || siteTitle;

  const structuredDataJson = structuredData
    ? JSON.stringify(structuredData, (key, value) => {
        if (typeof value === "string") {
          if (/^(?:https?:|data:|blob:|mailto:|tel:|sms:)/i.test(value)) {
            return value;
          }
          if (value.startsWith("//") || value.startsWith("/")) {
            return toAbsoluteUrl(value) || value;
          }
          if (/url$/i.test(key)) {
            return toAbsoluteUrl(value) || value;
          }
          return value;
        }

        if (Array.isArray(value)) {
          if (/images?|photos?|logo/i.test(key)) {
            return value.map((item) =>
              typeof item === "string" ? toAbsoluteUrl(item) || item : item
            );
          }
        }

        return value;
      })
    : undefined;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:type" content={ogTypeValue} />
      <meta property="og:url" content={ogUrl} />
      {processedOgImages.map((imageUrl, index) => (
        <meta key={`og:image:${index}`} property="og:image" content={imageUrl} />
      ))}
      {absoluteOgImage && <meta property="og:image:secure_url" content={absoluteOgImage} />}
      <meta property="og:site_name" content={ogSiteName} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {absoluteOgImage && <meta name="twitter:image" content={absoluteOgImage} />}

      {/* No index if specified */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* JSON-LD structured data */}
      {structuredDataJson && (
        <script type="application/ld+json">
          {structuredDataJson}
        </script>
      )}

      {/* Additional head elements */}
      {children}
    </Helmet>
  );
};

export default SEO;
