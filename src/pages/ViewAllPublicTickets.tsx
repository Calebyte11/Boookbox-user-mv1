/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { AlertCircle, Search, ChevronLeft } from "lucide-react";
import Button from "@/components/Button";
import TicketNearYou from "@/components/TicketNearYou";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "@/features/auth/hooks";
import { usePublicBookingsQuery } from "@/hooks/useUserQueries";
import { TicketsSkeleton } from "@/components/SkeletonLoader";
import type { Ticket } from "@/types/ticket";

const ViewAllPublicTickets = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "recent" | "active" | "expired"
  >("all");
  // const { user } = useAuth();

  // Fetch public bookings data from API
  const { data: ticketsData, isLoading, error } = usePublicBookingsQuery();

  // Transform booking data to ticket format for display
  const tickets = useMemo(() => {
    if (!ticketsData) return [];

    // Handle different response structures
    let ticketList: any[] = [];
    if (Array.isArray(ticketsData)) {
      ticketList = ticketsData;
    } else if (
      (ticketsData as any).data &&
      Array.isArray((ticketsData as any).data)
    ) {
      ticketList = (ticketsData as any).data;
    } else if (
      (ticketsData as any).bookings &&
      Array.isArray((ticketsData as any).bookings)
    ) {
      ticketList = (ticketsData as any).bookings;
    } else {
      return [];
    }

    // Transform to ticket format
    return ticketList.map((booking: any) => ({
      id: booking.bookingId || "",
      title: booking.menuItems?.[0]?.name || "Meal Package",
      description: booking.reason || "Delicious meal package",
      image: booking.image || "",
      status: booking.status || "active",
      price: booking.totalAmount || 0,
      quantity: booking.numberOfBookings || 1,
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt),
      isActive: booking.status === "paid" || booking.status === "active",
      userId: booking.bookedById || "",
      date: new Date(
        booking.validityDate?.stop || booking.createdAt
      ).toLocaleDateString(),
      currency: booking.currency || "₦",
      restaurantId: booking.restaurantId || "",
      bookedByName: booking.bookedByName || "Anonymous",
    })) as Ticket[];
  }, [ticketsData]);

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    if (!tickets) return [];

    let filtered = tickets;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = tickets.filter(
        (ticket: Ticket) =>
          ticket.title.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          (ticket as any).bookedByName?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterBy === "active") {
      filtered = filtered.filter(
        (ticket: Ticket) => ticket.isActive && ticket.status !== "expired"
      );
    } else if (filterBy === "expired") {
      filtered = filtered.filter(
        (ticket: Ticket) => ticket.status === "expired" || !ticket.isActive
      );
    }

    // Sort tickets - recent first
    if (filterBy === "recent" || filterBy === "all") {
      filtered = [...filtered].sort((a: Ticket, b: Ticket) => {
        const dateA = new Date(a.createdAt || "").getTime();
        const dateB = new Date(b.createdAt || "").getTime();

        // If no dates available, keep original order
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateB - dateA; // Most recent first
      });
    }

    return filtered;
  }, [tickets, searchQuery, filterBy]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleTicketClick = (ticket: Ticket) => {
      navigate(`tickets/claim/${ticket.id}`);
  
  };
  if (isLoading) {
    return <TicketsSkeleton />;
  }

  if (error) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load tickets</p>
            <Button
              className="bg-primary text-white px-4 py-2 rounded-lg"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4">
      {/* Header */}
      <div className="flex items-center mb-4 md:block">
        <Button
          className="rounded-xl p-2 bg-[#ECE6F0] mr-4 md:mr-0 md:mb-4"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-6 w-6 text-black" />
        </Button>
        <h1 className="text-2xl font-semibold text-center flex-1 md:text-left">
          All Public Tickets{" "}
          <span className="bg-primary/10 p-2 w-4 rounded-lg">
            <span className="bg-primary/10 p-1.5 px-4.5 rounded-lg">
              {filteredAndSortedTickets.length}
            </span>
          </span>
        </h1>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <form className="relative" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl bg-[#ECE6F0] py-3 px-10 text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F]" />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#49454F] hover:text-primary"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: "all", label: "All", count: tickets.length },
          { key: "recent", label: "Recent", count: tickets.length },
          {
            key: "active",
            label: "Active",
            count: tickets.filter(
              (t: Ticket) => t.isActive && t.status !== "expired"
            ).length,
          },
          {
            key: "expired",
            label: "Expired",
            count: tickets.filter(
              (t: Ticket) => t.status === "expired" || !t.isActive
            ).length,
          },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterBy(filter.key as typeof filterBy)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filterBy === filter.key
                ? "bg-primary text-white"
                : "bg-[#ECE6F0] text-black hover:bg-primary/10"
            }`}
          >
            {filter.label}{" "}
            <span className="bg-primary/10 py-1.5 px-3 rounded-lg">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Results Indicator */}
      {searchQuery && (
        <div className="mb-4 p-3 bg-[#E3F5FF] rounded-lg">
          <p className="text-sm text-gray-700">
            Showing {filteredAndSortedTickets.length} result(s) for "
            {searchQuery}"
          </p>
        </div>
      )}

      {/* Tickets Display */}
      {filteredAndSortedTickets.length > 0 ? (
        <TicketNearYou
          items={filteredAndSortedTickets}
          config={{
            title: "Available Tickets",
            ctaText: "",
          }}
          className="my-0"
          onItemClick={handleTicketClick}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No tickets found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No public tickets available at the moment"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default ViewAllPublicTickets;
