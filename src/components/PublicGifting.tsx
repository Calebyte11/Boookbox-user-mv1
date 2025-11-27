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
  // BookingData,
} from "@/types/sponsor";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PublicGiftingProps {
  maxItems?: number; // Optional prop to limit number of items shown
}

const PublicGifting = ({ maxItems }: PublicGiftingProps) => {
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
      id: booking.bookingId,
      description: `${booking.reason} - By ${booking.bookedByName}`,
      image: booking.image || ActivityHero,
      status:
        booking.status === "paid" || booking.status === "claimed"
          ? "active"
          : "inactive",
      statusText:
        booking.status === "paid"
          ? "Paid"
          : booking.status === "used"
          ? "Used"
          : booking.status === "expired"
          ? "Expired"
          : booking.status === "claimed"
          ? "Claimed"
          : "Pending",

      // Add booking data for navigation
      bookingData: booking,
    }));
  };
  // Transform public bookings data
  const allPublicGifts: GiftItem[] = Array.isArray(publicBookingsData?.data)
    ? transformBookingsToGifts(publicBookingsData.data)
    : [];

  // Apply maxItems limit if specified
  const publicGifts: GiftItem[] = maxItems
    ? allPublicGifts.slice(0, maxItems)
    : allPublicGifts;

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
    link: "/tickets/public/view-all",
  };
  const handleItemClick = (item: GiftItem) => {
    // Navigate to claim ticket page using the correct route structure
    navigate(`/tickets/claim/${item.id}`);
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
        />
      )}
    </section>
  );
};

export default PublicGifting;
