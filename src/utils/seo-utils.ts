/**
 * SEO utility functions for generating dynamic metadata
 */

/**
 * Generate meta description from content
 * @param text Text content to extract description from
 * @param maxLength Maximum length of description (default: 160)
 * @returns Truncated description suitable for meta tags
 */
export function generateMetaDescription(text: string, maxLength = 160): string {
  // Clean up text
  const cleaned = text
    .replace(/\s+/g, " ")
    .replace(/<[^>]*>/g, "")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Truncate to closest word boundary
  return cleaned.substring(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

/**
 * Extract keywords from content
 * @param text Text content to extract keywords from
 * @param maxKeywords Maximum number of keywords to extract (default: 10)
 * @returns Comma-separated list of keywords
 */
export function extractKeywords(text: string, maxKeywords = 10): string {
  // This is a basic implementation
  // In a real app, you might use a more sophisticated NLP approach

  // Common words to exclude
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "of",
    "from",
    "that",
    "this",
    "these",
    "those",
    "it",
    "its",
  ]);

  // Clean and tokenize text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Count word frequency
  const frequency: Record<string, number> = {};
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1;
  }

  // Sort by frequency and take top keywords
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
    .join(", ");
}

/**
 * Generate structured data for a restaurant
 * @param restaurant Restaurant object with details
 * @returns JSON-LD structured data object for a restaurant
 */
export function generateRestaurantSchema(restaurant: {
  name: string;
  address: string;
  image?: string;
  description?: string;
  priceRange?: string;
  telephone?: string;
  servesCuisine?: string;
  rating?: number;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: restaurant.address,
    },
    ...(restaurant.image && { image: restaurant.image }),
    ...(restaurant.description && { description: restaurant.description }),
    ...(restaurant.priceRange && { priceRange: restaurant.priceRange }),
    ...(restaurant.telephone && { telephone: restaurant.telephone }),
    ...(restaurant.servesCuisine && {
      servesCuisine: restaurant.servesCuisine,
    }),
    ...(restaurant.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: restaurant.rating,
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };
}

/**
 * Generate structured data for an article or blog post
 * @param article Article object with details
 * @returns JSON-LD structured data object for an article
 */
export function generateArticleSchema(article: {
  title: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  description?: string;
  url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    author: {
      "@type": "Person",
      name: article.author,
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    ...(article.image && { image: article.image }),
    ...(article.description && { description: article.description }),
    url: article.url,
    publisher: {
      "@type": "Organization",
      name: "BOOOK-BOX",
      logo: {
        "@type": "ImageObject",
        url: "/apple-touch-icon.png",
      },
    },
  };
}
