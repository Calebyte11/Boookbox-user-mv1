import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, User, ChevronLeft } from "lucide-react";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import SEO from "@/components/SEO";
import { getRestaurantRating } from "@/services/favoriteRatingService";
import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
interface Rating {
  user: {
    fullName: string;
    profileImage?: string;
  };
  restaurant: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

const RestaurantRatingsPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();

  const {
    data: ratingsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["restaurantRating", restaurantId],
    queryFn: () => getRestaurantRating(restaurantId || ""),
    enabled: !!restaurantId,
  });

  const {
    data: restaurantData,
    isLoading: restaurantLoading,
    // error,
    // isError,
  } = useRestaurantDetailQuery(restaurantId || "", {
    enabled: !!restaurantId,
  });

  const handleBack = () => {
    navigate(-1);
  };

  console.log("ratingData=>", ratingsData);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Render star rating
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading && restaurantLoading) {
    return (
      <div className="min-h-screen bg-white">
        <SEO title="Restaurant Ratings" />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <SEO title="Restaurant Ratings" />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to load ratings
            </h2>
            <p className="text-gray-500 mb-4">
              Unable to fetch restaurant ratings at this time.
            </p>
            {error && (
              <p className="text-red-500 text-sm mb-4">
                {error instanceof Error
                  ? error.message
                  : "Unknown error occurred"}
              </p>
            )}
            <Button
              handleClick={handleBack}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }
  // Safely extract data with fallbacks
  const ratingsArray = ratingsData?.data || [];
  const totalRatings = ratingsData?.totalRatings || 0;

  // Calculate average rating from the ratings array
  const averageRating =
    ratingsArray.length > 0
      ? ratingsArray.reduce(
          (sum: number, rating: Rating) => sum + rating.rating,
          0
        ) / ratingsArray.length
      : 0;

  return (
    <div className="min-h-screen bg-white">
      {" "}
      <SEO
        title={`Restaurant - Ratings & Reviews`}
        description={`Read ${totalRatings} reviews and ratings for this restaurant`}
      />
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {" "}
          <Button
            className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
            onClick={handleBack}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">
            Ratings & Reviews
          </h1>
          <div className="w-16" /> {/* Spacer */}
        </div>
      </div>
      {/* Rating Summary */}
      <div className="px-4 py-6 bg-gray-50 border-b border-gray-200">
        {" "}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
            {restaurantData?.name}
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            {renderStarRating(Math.round(averageRating))}
            <span className="text-2xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-gray-600">
            Based on {totalRatings} review{totalRatings !== 1 ? "s" : ""}
          </p>
        </div>
      </div>{" "}
      {/* Reviews List */}
      <div className="px-4 py-6">
        {isLoading || restaurantLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : !Array.isArray(ratingsArray) || ratingsArray.length === 0 ? (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-500">
              Be the first to leave a review for this restaurant!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {ratingsArray.map((rating: Rating) => (
              <div
          key={rating.createdAt || `rating-${Math.random()}`}
          className="border-b border-gray-200 pb-6 last:border-b-0"
              >
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {rating.user.profileImage ? (
                <img
            src={rating.user.profileImage}
            alt={rating.user.fullName || "User"}
            className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>

            {/* Review Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div>
            <h4 className="font-medium text-gray-900">
              {rating.user.fullName || "Anonymous User"}
            </h4>
            <p className="text-sm text-gray-500">
              {formatDate(rating.createdAt)}
            </p>
                </div>
                {renderStarRating(rating.rating)}
              </div>

              {rating.comment && (
                <p className="text-gray-700 leading-relaxed">
            {rating.comment}
                </p>
              )}
            </div>
          </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantRatingsPage;
