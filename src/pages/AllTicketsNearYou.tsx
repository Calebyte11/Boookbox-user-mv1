/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState } from "react";
import TicketNearYou from "@/components/TicketNearYou";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import { useNavigate } from "react-router-dom";
import { useLocationService } from "@/hooks/useLocationService";
import { useNearbyBookingsQuery } from "@/hooks/useUserQueries";
import { useLocationStore } from "@/store/locationStore";
import { sortByDistance, formatDistance } from "@/utils/locationUtils";
import type { BookingDetail, Ticket } from "@/types/ticket";

const AllTicketsNearYou = () => {
  const navigate = useNavigate();
  const locationStore = useLocationStore();
  const location = locationStore.position;
  const { ipLocation, hasLocation } = useLocationService({ autoRequest: true });

  const coordinates = useMemo(() => {
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
  }, [location, ipLocation]);

  const {
    data: NearbyBooking,
    isLoading,
    isError,
    error,
  } = useNearbyBookingsQuery({
    page: 1,
    limit: 50,
    latitude: location?.latitude ?? coordinates?.latitude,
    longitude: location?.longitude ?? coordinates?.longitude,
    enable: hasLocation || !!ipLocation,
  });

  const transformBookingsToTickets = (bookings: BookingDetail[]): Ticket[] => {
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
        booking.bookedAtRestaurant?.profileImage ||
        ActivityHero,
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
      lat: booking.bookedAtRestaurant?.location?.coordinates?.[1] || 0,
      lng: booking.bookedAtRestaurant?.location?.coordinates?.[0] || 0,
      restaurantAddress: booking.bookedAtRestaurant?.address || "",
      slotsTaken: booking.slotsTaken ?? 0,
      numberOfBookings: booking.numberOfBookings ?? 1,
    }));
    if (coordinates) {
      const userLocation = {
        lat: coordinates.latitude,
        lng: coordinates.longitude,
      };
      const ticketsWithLocation = tickets.filter(
        (ticket) => ticket.lat && ticket.lng
      );
      const sortedWithDistance = sortByDistance(
        userLocation,
        ticketsWithLocation.map((ticket) => ({
          id: ticket.id,
          lat: ticket.lat!,
          lng: ticket.lng!,
        })),
        "km"
      );
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
    return tickets;
  };

  const ticketsNearby: Ticket[] = Array.isArray(NearbyBooking?.data)
    ? transformBookingsToTickets(NearbyBooking.data)
    : [];

  // Filter logic
  const [filter, setFilter] = useState<
    "all" | "available" | "claimed" | "used" | "expired"
  >("all");
  const filterTabs = [
    { key: "all", label: "All" },
    { key: "available", label: "Available" },
    { key: "claimed", label: "Claimed" },
    { key: "used", label: "Used" },
    { key: "expired", label: "Expired" },
  ];

  const filteredTickets = ticketsNearby.filter((ticket) => {
    if (filter === "all") return true;
    if (filter === "available")
      return ticket.status === "active" || ticket.status === "paid";
    if (filter === "claimed") return ticket.status === "claimed";
    if (filter === "used") return ticket.status === "used";
    if (filter === "expired") return ticket.status === "expired";
    return true;
  });

  const emptyState = {
    title: "No tickets near you",
    buttonText: "Back to Home",
    buttonAction: () => navigate("/"),
    heroImage: ActivityHero,
  };

  const config = {
    title: "All Tickets Near You",
    ctaText: "",
    link: "",
    onCtaClick: undefined,
  };

  return (
    <section className="py-6 px-4 max-w-2xl mx-auto">
      <div className="mb-4 flex gap-2 justify-center">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors duration-150 ${
              filter === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-primary border-gray-300"
            }`}
            onClick={() => setFilter(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          <span className="ml-2">Loading tickets near you...</span>
        </div>
      ) : isError ? (
        <div className="text-center p-4">
          <p className="text-red-600">
            Error loading tickets: {error?.message}
          </p>
        </div>
      ) : (
        <TicketNearYou
          items={filteredTickets.length > 0 ? filteredTickets : []}
          emptyState={emptyState}
          config={config}
          onItemClick={(item: Ticket) => navigate(`/tickets/claim/${item.id}`)}
        />
      )}
    </section>
  );
};

export default AllTicketsNearYou;
