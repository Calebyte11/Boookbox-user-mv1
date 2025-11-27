/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from "react-router-dom";
import GiftList from "@/components/GiftList";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import { usePublicBookingsQuery } from "@/hooks/useUserQueries";
import Button from "@/components/Button";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
  //   BookingData,
} from "@/types/sponsor";
import LoadingSpinner from "@/components/LoadingSpinner";

const PublicGifting = () => {
  const navigate = useNavigate();

  // Fetch public bookings
  const {
    data: publicBookingsData,
    isLoading: isPublicLoading,
    error: publicError,
  } = usePublicBookingsQuery();

  console.log("🌍 Public bookings query result:", {
    data: publicBookingsData,
    loading: isPublicLoading,
    error: publicError,
  });
  // Transform booking data to gift format
  const transformBookingsToGifts = (bookings: any[]): GiftItem[] => {
    return bookings.map((booking) => ({
      id: booking._id,
      description: `${booking.reason} - By ${booking.bookedByName}`,
      image: booking.image || ActivityHero,
      status: booking.status === "paid" ? "active" : "inactive",
      statusText:
        booking.status === "paid"
          ? "Available"
          : booking.status === "pending"
          ? "Pending"
          : booking.status === "confirmed"
          ? "Confirmed"
          : booking.status === "completed"
          ? "Completed"
          : "Unavailable",
      // Add booking data for navigation
      bookingData: booking,
    }));
  };

  // Transform public bookings data
  const publicGifts: GiftItem[] = Array.isArray(publicBookingsData?.data)
    ? transformBookingsToGifts(publicBookingsData.data)
    : [];

  const emptyState: EmptyStateConfig = {
    title: "No public gifts available",
    buttonText: "Explore Restaurants",
    buttonAction: () => {
      navigate("/restaurants");
    },
    heroImage: ActivityHero,
  };

  const config: GiftListConfig = {
    title: "Public Gifts",
    ctaText: "View all",
    onCtaClick: () => {
      navigate("/tickets/public/view-all");
    },
  };

  const handleItemClick = (item: GiftItem) => {
    // Navigate to booking details page
    navigate(`/bookings/${item.bookingData?.bookingId || item.id}`);
  };

  if (publicError) {
    console.error("Public gifts loading error:", publicError);

    return (
      <section className="p-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Unable to load public gifts. Please try again.
          </p>
          <Button
            className="bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      {isPublicLoading ? (
        <LoadingSpinner />
      ) : (
        <GiftList
          items={publicGifts}
          config={config}
          emptyState={emptyState}
          onItemClick={handleItemClick}
          showTimeAgo={true}
        />
      )}
    </section>
  );
};

export default PublicGifting;
