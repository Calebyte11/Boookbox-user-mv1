import { useCallback, useMemo } from "react";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import GiftList from "@/components/GiftList";
import { useNavigate } from "react-router-dom";
import {
  useGiftedBookingsQuery,
  useOthersBookingsQuery,
  usePublicBookingsQuery,
} from "@/hooks/useUserQueries";
import { useAuth } from "@/features/auth/hooks";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
  BookingData,
} from "@/types/sponsor";
import { ListSkeleton } from "@/components/SkeletonLoader";

interface RecentGiftingProps {
  maxItems?: number;
}

const RecentGifting = ({ maxItems }: RecentGiftingProps) => {
  const navigate = useNavigate();
  // Fetch gifted bookings from API
  const {
    data: giftedBookingsData,
    isLoading,
    error,
    isError,
  } = useGiftedBookingsQuery({
    page: 1,
    limit: maxItems, // Limit to recent gifts for this component
  });
  const { user } = useAuth();
  // Fetch bookings made for others
  const {
    data: othersBookingsData,
    isLoading: isOthersLoading,
    error: othersError,
    isError: isOthersError,
  } = useOthersBookingsQuery({
    page: 1,
    limit: maxItems, // Limit to recent gifts for this component
  }); // Fetch public bookings (optional, can be used for public gifting)
  const {
    data: publicBookingsData,
    isLoading: isPublicLoading,
    error: publicError,
    isError: isPublicError,
  } = usePublicBookingsQuery({
    page: 1,
    limit: maxItems, // Limit to recent gifts for this component
  });

  // Transform booking data to gift format
  const transformBookingsToGifts = useCallback(
    (bookings: BookingData[]): GiftItem[] => {
      // Generate better descriptions based on booking type
      const getBookingDescription = (booking: BookingData): string => {
        const isGiftedByOthers =
          user &&
          // Check by ID (primary identifier)
          ((user.id && booking.bookedById !== user.id) ||
            // Fallback check by email if ID doesn't match
            (user.email &&
              booking.bookedByUser?.email &&
              booking.bookedByUser.email.toLowerCase() !==
                user.email.toLowerCase()));

        if (isGiftedByOthers) {
          return `Gift received from ${booking.bookedByName || "someone"}`;
        }
        const bookedForType = booking.bookedFor?.type;
        switch (bookedForType) {
          case "self":
            return "Reserved by you";
          case "others":
            return `Gifted to someone special`;
          case "public":
            return "Available for public claim";
          default:
            return `Meal booking`;
        }
      };
      const isBookedByCurrentUser = (booking: BookingData): boolean =>
        !!(
          user &&
          ((user.id && booking.bookedById === user.id) ||
            (user.email &&
              booking.bookedByUser?.email &&
              booking.bookedByUser.email.toLowerCase() ===
                user.email.toLowerCase()))
        );

      return bookings.map((booking) => ({
        id: booking._id,
        description: getBookingDescription(booking),
        image: booking.image || "",
        status: booking.status === "paid" ? "active" : "inactive",
        statusText:
          booking.status === "paid"
            ? `${isBookedByCurrentUser(booking) ? "Paid" : "Active"}`
            : booking.status === "used"
            ? "Used"
            : booking.status === "expired"
            ? "Expired"
            : booking.status === "claimed"
            ? "Claimed"
            : "Pending",
        reason: booking.reason || "Meal package",
        bookedFor:
          booking.bookedFor?.type === "public"
            ? "Public"
            : booking.bookedFor?.type === "others"
            ? `For ${booking.bookedByName || "Others"}`
            : `For ${booking.bookedByName || "Self"}`,
        bookedBy: `From ${booking.bookedByName}`,
        bookingData: booking,
      }));
    },
    [user]
  ); // Process the gifts data - combine gifted, others, and public bookings
  const gifts: GiftItem[] = useMemo(() => {
    const allBookings: BookingData[] = [];

    // Add gifted bookings
    if (giftedBookingsData?.data && Array.isArray(giftedBookingsData.data)) {
      allBookings.push(...giftedBookingsData.data);
    }

    // Add bookings made for others
    if (othersBookingsData?.data && Array.isArray(othersBookingsData.data)) {
      allBookings.push(...othersBookingsData.data);
    }

    // Add public bookings
    if (publicBookingsData?.data && Array.isArray(publicBookingsData.data)) {
      allBookings.push(...publicBookingsData.data);
    }

    // Sort by creation date (most recent first) if available
    // const sortedBookings = allBookings.sort((a, b) => {
    //   const dateA = new Date(a.createdAt || 0).getTime();
    //   const dateB = new Date(b.createdAt || 0).getTime();
    //   return dateB - dateA;
    // });

    const getBookingDate = (booking: BookingData) => {
      // Try all possible date fields in order of priority
      return new Date(
        booking.bookedAt || booking.updatedAt || booking.createdAt || 0
      ).getTime();
    };

    const sortedBookings = allBookings.sort((a, b) => {
      const dateA = getBookingDate(a);
      const dateB = getBookingDate(b);
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });

    // Apply maxItems limit if specified
    const limitedBookings = maxItems
      ? sortedBookings.slice(0, maxItems)
      : sortedBookings;

    return transformBookingsToGifts(limitedBookings);
  }, [
    giftedBookingsData,
    othersBookingsData,
    publicBookingsData,
    maxItems,
    transformBookingsToGifts,
  ]);

  const hasGifts = gifts.length > 0;
  const emptyState: EmptyStateConfig = {
    title: "It seems you're yet to gift an item",
    buttonText: "Send your first gift",
    buttonAction: () => {
      navigate("/home");
      // Scroll to the Recommended section heading after navigation
      setTimeout(() => {
        const headingContainer = document.getElementById("recommended-heading-container");
        if (headingContainer) {
          headingContainer.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 50); // Short delay to ensure navigation is complete
    },
    heroImage: ActivityHero,
  };
  const config: GiftListConfig = {
    title: "Recent Gifting",
    ctaText: "View all",
    link: "/gifts",
  };
  const handleItemClick = (item: GiftItem) => {
    const isBookedByCurrentUser = (booking: BookingData): boolean =>
      !!(
        user &&
        ((user.id && booking.bookedById === user.id) ||
          (user.email &&
            booking.bookedByUser?.email &&
            booking.bookedByUser.email.toLowerCase() ===
              user.email.toLowerCase()))
      );

    const booking = item.bookingData;

    // Check if this booking can be claimed (paid and not booked for others)
    const canClaim =
      booking &&
      booking.status === "paid" &&
      booking.bookedFor?.type !== "others" &&
      !isBookedByCurrentUser(booking);
    if (canClaim) {
      // Navigate to claim ticket view for claimable bookings
      navigate(`/tickets/claim/${booking.bookingId || item.id}`);
    } else {
      // Navigate to booking details page for other bookings
      navigate(`/bookings/${booking?.bookingId || item.id}`);
    }
  }; // Show loading state - check if any query is loading
  if (isLoading || isOthersLoading || isPublicLoading) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Gifting</h2>
        <ListSkeleton count={maxItems || 4} />
      </div>
    );
  }

  // Show error state - only if all queries fail and no gifts are available
  if ((isError || isOthersError || isPublicError) && !hasGifts) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : othersError instanceof Error
        ? othersError.message
        : publicError instanceof Error
        ? publicError.message
        : "Failed to load recent gifts";

    return (
      <div className="p-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            className="text-primary underline"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <GiftList
      items={hasGifts ? gifts : []}
      config={config}
      emptyState={emptyState}
      onItemClick={handleItemClick}
      showTimeAgo={true}
    />
  );
};

export default RecentGifting;
