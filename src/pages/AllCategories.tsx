import React from "react";
import { useNavigate } from "react-router-dom";
import {
  UtensilsCrossed,
  ShoppingCart,
  Snowflake,
  Wine,
  ChefHat,
  Apple,
  Store,
  Cake,
  Bus,
  PartyPopper,
  Gift,
  Croissant,
  Pill,
  Flag,
  Hotel,
  ParkingCircle,
  Music,
  Leaf,
} from "lucide-react";
import SEO from "@/components/SEO";
import { CATEGORY_REGISTRY, type CategoryId } from "@/config/categoryConfig";

const AllCategories: React.FC = () => {
  const navigate = useNavigate();

  const categories = Object.values(CATEGORY_REGISTRY);

  const handleCategoryClick = (category: CategoryId) => {
    navigate(
      category === "restaurant" ? '/restaurants/view-all' : `/${category}/view-all`
    );
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

          {/* Categories Grid - 4 columns responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group cursor-pointer flex flex-col items-center justify-start p-4 md:p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon Container */}
                <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gray-100 rounded-lg group-hover:bg-orange-100 transition-colors">
                  {getCategoryIcon(category.id, "w-6 h-6 md:w-8 md:h-8 text-gray-700 group-hover:text-orange-600")}
                </div>

                {/* Category Label */}
                <h3 className="text-center text-sm md:text-base font-semibold text-gray-900">
                  {category.label}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

// Helper function to get icon for each category
function getCategoryIcon(categoryId: CategoryId, className: string): React.ReactNode {
  const iconProps = { className, strokeWidth: 1.5 };

  const iconMap: Record<CategoryId, React.ReactNode> = {
    restaurant: <UtensilsCrossed {...iconProps} />,
    groceries: <ShoppingCart {...iconProps} />,
    "frozen-foods": <Snowflake {...iconProps} />,
    "wine-drinks": <Wine {...iconProps} />,
    "food-market": <ChefHat {...iconProps} />,
    "fruit-market": <Apple {...iconProps} />,
    "free-market": <Store {...iconProps} />,
    confectionery: <Cake {...iconProps} />,
    "transport-tickets": <Bus {...iconProps} />,
    "hangout-tickets": <PartyPopper {...iconProps} />,
    "gift-stores": <Gift {...iconProps} />,
    bakery: <Croissant {...iconProps} />,
    "pharma-stores": <Pill {...iconProps} />,
    "made-in-nigeria": <Flag {...iconProps} />,
    hospitality: <Hotel {...iconProps} />,
    "car-parking-services": <ParkingCircle {...iconProps} />,
    nightlife: <Music {...iconProps} />,
    "vegetable-market": <Leaf {...iconProps} />,
  };

  return iconMap[categoryId] || <Store {...iconProps} />;
}

export default AllCategories;
