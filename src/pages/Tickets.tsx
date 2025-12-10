// /* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { SegmentedControl } from "@radix-ui/themes";
import GiftList from "@/components/GiftList";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import TicketNearYou from "@/components/TicketNearYou";
import { useNavigate } from "react-router-dom";
// Removed useLocationService; use only useLocationStore
// import { getCurrentPosition, reverseGeocode } from "@/utils/geolocationUtils";
import { sortByDistance, formatDistance } from "@/utils/locationUtils";
import { useLocationStore } from "@/store/locationStore";

import {
  useTicketsQuery,
  useNearbyBookingsQuery,
} from "@/hooks/useUserQueries";
import { TicketsSkeleton } from "@/components/SkeletonLoader";
import type {
  GiftItem as TicketItem,
  GiftListConfig,
  EmptyStateConfig,
  BookingData,
} from "@/types/sponsor";

import type {
  EmptyTicketConfig,
  TicketListConfig,
  Ticket,
} from "@/types/ticket";

const RecipientTickets = () => {
  const navigate = useNavigate();
  const locationStore = useLocationStore();
  const location = locationStore.position;
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"gifts" | "tickets">("tickets");
  // Removed unused setError state

  // Get location data directly from the store
  const ipLocation = locationStore.ipLocation;
  const hasLocation = locationStore.hasLocation;
  const geoLoading = locationStore.isLoadingGPS || locationStore.isLoadingIP;
  const geoError = locationStore.error;
  // Removed unused permissionStatus

  // Get coordinates from best available source: manual > GPS > IP
  const coordinates = useMemo(() => {
    if (locationStore.manualLocation) {
      return {
        latitude: locationStore.manualLocation.position.latitude,
        longitude: locationStore.manualLocation.position.longitude,
      };
    }
    if (location) {
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }
    if (ipLocation) {
      return {
        latitude: ipLocation.latitude,
        longitude: ipLocation.longitude,
      };
    }
    return null;
  }, [locationStore.manualLocation, location, ipLocation]);

  // Remove direct geolocation fetching; handled globally
  useEffect(() => {
    setLoading(false);
  }, []);

  // We have location if we have either GPS or IP location
  const hasAnyLocation = hasLocation || !!ipLocation;
  // No retry logic; only read from store

  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    isError: isTicketsError,
    error: ticketsError,
  } = useTicketsQuery();
  const {
    data: NearbyBooking,
    isLoading: isPublicBookingsLoading,
    isError: isPublicBookingsError,
    error: publicBookingsError,
  } = useNearbyBookingsQuery({
    page: 1,
    limit: 10,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    enable: hasAnyLocation, // Use combined location availability
  });

  const myTickets: TicketItem[] = Array.isArray(ticketsData?.data)
    ? ticketsData.data
        .map((ticket) => {
          let status: TicketItem["status"];
          switch (ticket.status) {
            case "unused":
              status = "active";
              break;
            case "used":
              status = "claimed";
              break;
            case "expired":
              status = "expired";
              break;
            case "refunded":
              status = "refunded";
              break;
            case "pending":
              status = "pending";
              break;
            case "inactive":
              status = "inactive";
              break;
            default:
              status = "inactive";
          }
          return {
            id: ticket.ticketId,
            description: ticket.bookedByName
              ? `Ticket from ${ticket.bookedByName}`
              : "Meal Ticket",
            image: ticket.image,
            status,
            statusText:
              status === "active"
                ? "Available"
                : status === "claimed"
                ? "Claimed"
                : status === "expired"
                ? "Expired"
                : status === "refunded"
                ? "Refunded"
                : status === "pending"
                ? "Pending"
                : "Inactive",
          };
        })
        .slice(0, 5) // Limit to 5 tickets
    : [];
  const transformBookingsToTickets = (bookings: BookingData[]): Ticket[] => {
    if (!Array.isArray(bookings)) return [];

    const tickets = bookings.map((booking) => ({
      id: booking.bookingId,
      title: booking.reason || "Meal Package",
      description:
        booking.bookedByName || booking.bookedByUser?.fullName
          ? `Sponsored by ${
              booking.bookedByName || booking.bookedByUser?.fullName
            }`
          : "Available for claim",
      image:
        booking.customImage ||
        booking.bookedAtRestaurant?.profileImage || "",
      status:
        booking.status === "paid" || booking.status === "used"
          ? "active"
          : "inactive",
      statusText:
        booking.status === "paid"
          ? "Available"
          : booking.status === "claimed"
          ? "Claimed"
          : booking.status === "used"
          ? "Claimed"
          : booking.status === "expired"
          ? "Expired"
          : booking.status === "refunded"
          ? "Refunded"
          : "pending",
      quantity: 1,
      isActive: booking.status === "paid" || booking.status === "claimed",
      userId: booking.bookedById || booking.bookedByUser?._id || "",
      date: (() => {
        if (typeof booking.validityDate === "string") {
          return new Date(booking.validityDate).toLocaleDateString();
        } else if (booking.validityDate?.stop) {
          return new Date(booking.validityDate.stop).toLocaleDateString();
        } else if (booking.validityDate?.start) {
          return new Date(booking.validityDate.start).toLocaleDateString();
        } else {
          return "No expiry";
        }
      })(),
      // Add location data if available
      lat: booking.bookedAtRestaurant?.location?.coordinates?.[1] || 0,
      lng: booking.bookedAtRestaurant?.location?.coordinates?.[0] || 0,
      restaurantAddress: booking.bookedAtRestaurant?.address || "",
      slotsTaken: booking.slotsTaken ?? 0,
      numberOfBookings: booking.numberOfBookings ?? 1,
    })); // Sort by distance if user location is available
    if (coordinates) {
      const userLocation = {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      };
      const ticketsWithLocation = tickets.filter(
        (ticket) => ticket.lat && ticket.lng
      );

      // Sort tickets by distance from user location
      const sortedWithDistance = sortByDistance(
        userLocation,
        ticketsWithLocation.map((ticket) => ({
          id: ticket.id,
          lat: ticket.lat!,
          lng: ticket.lng!,
        })),
        "km"
      );

      // Map distance info back to the full Ticket objects
      const sortedTickets = sortedWithDistance
        .map((sorted) => {
          const original = ticketsWithLocation.find((t) => t.id === sorted.id);
          if (!original) return null;
          return {
            ...original,
            description: `${original.description} • ${formatDistance(
              sorted.distance,
              "km"
            )} away`,
          };
        })
        .filter(Boolean) as Ticket[];

      return sortedTickets;
    }

    return tickets.slice(0, 10); // Limit to 10 tickets if no location
  };

  const ticketsNearby: Ticket[] = Array.isArray(NearbyBooking?.data)
    ? transformBookingsToTickets(NearbyBooking.data)
    : [];

  const emptyState: EmptyStateConfig = {
    title: "No ticket available",
    buttonText: "Ticket to your first package",
    buttonAction: () => navigate("/gifts"),
    heroImage: ActivityHero,
  };

  const config: GiftListConfig = {
    title: "My Ticket",
    ctaText: "View all",
    link: "/tickets/view-all",
    onCtaClick: () => navigate(`/tickets/view-all`),
  };

  const handleItemClick = (item: TicketItem) => {
    if (item.id) {
      navigate(`/tickets/viewdetails/${item.id}`);
    }
  };

  const emptyTicket: EmptyTicketConfig = {
    title: "No tickets available",
    buttonText: "Explore Tickets",
    buttonAction: () => console.log("Navigate to explore tickets"),
    heroImage: ActivityHero,
  };

  const ticketConfig: TicketListConfig = {
    title: "Tickets Near You",
    ctaText: "",
    link: "/tickets/near-you",
    onCtaClick: () => navigate(`/tickets/near-you`),
  };

  return (
    <section className="mx-2 md:mx-5">
      {/* Segmented Control for Gifts and Tickets */}
      <div className="mt-4 mb-6 flex justify-center w-full">
        <SegmentedControl.Root
          value={activeView}
          onValueChange={(value) => {
            setActiveView(value as "gifts" | "tickets");
            if (value === "gifts") {
              navigate("/gifts");
            }
          }}
          className="w-full max-w-md mx-auto"
        >
          <SegmentedControl.Item value="gifts" className="flex-1 text-center">
            Gifts
          </SegmentedControl.Item>
          <SegmentedControl.Item value="tickets" className="flex-1 text-center">
            Tickets
          </SegmentedControl.Item>
        </SegmentedControl.Root>
      </div>

      {isTicketsError && <p>Error loading tickets: {ticketsError?.message}</p>}
      {isTicketsLoading ? (
        <TicketsSkeleton />
      ) : (
        !isTicketsError && (
          <GiftList
            items={myTickets}
            config={config}
            emptyState={emptyState}
            onItemClick={handleItemClick}
          />
        )
      )}
      <div>
        {geoLoading && loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Getting your location...</span>
          </div>
        ) : geoError && !ipLocation ? (
          <div className="text-center p-4">
            <p className="text-amber-600 mb-2">
              Unable to get your location: {geoError.message}
            </p>
            {/* Retry button removed; only store is used */}
            <p className="text-sm text-gray-600 mt-2">
              Showing default tickets instead
            </p>
          </div>
        ) : isPublicBookingsLoading ? (
          <TicketsSkeleton />
        ) : isPublicBookingsError ? (
          <div className="text-center p-4">
            <p className="text-red-600">
              Error loading tickets: {publicBookingsError?.message}
            </p>
          </div>
        ) : (
         <div className="">
          <TicketNearYou
            items={ticketsNearby.length > 0 ? ticketsNearby : []}
            emptyState={emptyTicket}
            config={ticketConfig}
            onItemClick={(item: Ticket) =>
              navigate(`/tickets/claim/${item.id}`)
            }
          />
         </div>
        )}
      </div>
    </section>
  );
};

export default RecipientTickets;
