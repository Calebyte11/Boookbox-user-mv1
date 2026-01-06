import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { CATEGORY_REGISTRY, type CategoryId } from "@/config/categoryConfig";

const AllCategories: React.FC = () => {
  const navigate = useNavigate();

  const categories = Object.values(CATEGORY_REGISTRY);

  const handleCategoryClick = (category: CategoryId) => {
    navigate(`/${category}/view-all`);
  };

  return (
    <>
      <SEO
        title="All Categories"
        description="Browse all available business categories on BoookBox - Restaurants, Groceries, and more."
        keywords="categories, restaurants, groceries, frozen foods, wine drinks, markets, tickets"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "BoookBox Categories",
          description: "Browse all available business categories",
        }}
        ogImage="/pwa-192x192.png"
      />

      <section className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              All Categories
            </h1>
            <p className="text-lg text-gray-600">
              Explore all available business categories and find what you need.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group cursor-pointer bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Category Card */}
                <div className="h-40 bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 right-2 w-20 h-20 bg-white rounded-full"></div>
                    <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-white rounded-full"></div>
                  </div>

                  {/* Category Label */}
                  <div className="relative text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white">
                      {getCategoryEmoji(category.id)}
                    </h2>
                  </div>
                </div>

                {/* Category Info */}
                <div className="p-4 md:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {category.label}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    { "Browse and discover"}
                  </p>

                  {/* CTA Button */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors font-medium text-sm group-hover:translate-x-1 transition-transform"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

// Helper function to get emoji for each category
function getCategoryEmoji(categoryId: CategoryId): string {
  const emojiMap: Record<CategoryId, string> = {
    restaurant: "🍽️",
    groceries: "🛒",
    "frozen-foods": "🧊",
    "wine-drinks": "🍷",
    "food-market": "🥘",
    "fruit-market": "🍎",
    "free-market": "🏪",
    confectionery: "🍰",
    "transport-tickets": "🚌",
    "hangout-tickets": "🎉",
    "gift-stores": "🎁",
    bakery: "🥐",
    "pharma-stores": "💊",
    "made-in-nigeria": "🇳🇬",
    hospitality: "🏨",
  };
  return emojiMap[categoryId] || "📦";
}

export default AllCategories;
