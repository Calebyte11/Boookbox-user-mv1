/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import GiftList from "@/components/GiftList";
import { useTicketsQuery } from "@/hooks/useUserQueries";
import Button from "@/components/Button";
import {
  Search,
  ChevronLeft,
  Calendar,
  TicketCheck,
  Eye,
  AlertCircle,
} from "lucide-react";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
  BookingData,
} from "@/types/sponsor";

// Extended interface for tickets
interface TicketItem extends GiftItem {
  ticketData?: BookingData;
}
import ActivityHero from "@/assets/images/sponsorbanner.png";
import { TicketsSkeleton } from "@/components/SkeletonLoader";

const AllTicketView = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "recent" | "unused" | "used" | "expired" | "active" | "available"
  >("all");

  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    isError: isTicketsError,
  } = useTicketsQuery();

  // Transform tickets data
  const allTickets: TicketItem[] = useMemo(() => {
    if (!Array.isArray(ticketsData?.data)) return [];

    return ticketsData.data.map((ticket: any) => ({
      id: ticket.ticketId || ticket._id,
      description: ticket.bookedByName
        ? `Ticket from ${ticket.bookedByName}`
        : ticket.reason || "Meal Ticket",
      image: ticket.image || "",
      status:
        ticket.status === "used" || ticket.status === "expired"
          ? "inactive"
          : "active",
      statusText:
        ticket.status === "unused"
          ? "Unused"
          : ticket.status === "used"
          ? "Used"
          : ticket.status === "expired"
          ? "Expired"
          : ticket.status === "active"
          ? "Active"
          : "Available",
      reason: ticket.reason || "Meal Package",
      bookedFor: ticket.bookedByName || "Self",
      bookedBy: ticket.bookedByName,
      // Store the original ticket data for filtering and additional info
      bookingData: ticket,
      ticketData: ticket,
    }));
  }, [ticketsData]);

  // Filter and search logic
  const filteredTickets = useMemo(() => {
    if (!allTickets || allTickets.length === 0) return [];

    let filtered = [...allTickets];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (ticket) =>
          ticket.description?.toLowerCase().includes(query) ||
          ticket.reason?.toLowerCase().includes(query) ||
          ticket.bookedFor?.toLowerCase().includes(query) ||
          ticket.bookedBy?.toLowerCase().includes(query) ||
          ticket.statusText?.toLowerCase().includes(query)
      );
    }

    // Apply filter by status
    if (filterBy === "unused") {
      filtered = filtered.filter(
        (ticket) => ticket.ticketData?.status === "unused"
      );
    } else if (filterBy === "used") {
      filtered = filtered.filter(
        (ticket) => ticket.ticketData?.status === "used"
      );
    } else if (filterBy === "expired") {
      filtered = filtered.filter(
        (ticket) => ticket.ticketData?.status === "expired"
      );
    } else if (filterBy === "active") {
      filtered = filtered.filter((ticket) => ticket.status === "active");
    } else if (filterBy === "available") {
      filtered = filtered.filter(
        (ticket) =>
          ticket.ticketData?.status === "unused" ||
          ticket.ticketData?.status === "paid"
      );
    }

    // Always sort by most recent first
    filtered.sort((a, b) => {
      const dateA = new Date(
        a.ticketData?.createdAt || a.ticketData?.updatedAt || 0
      ).getTime();
      const dateB = new Date(
        b.ticketData?.createdAt || b.ticketData?.updatedAt || 0
      ).getTime();

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });

    return filtered;
  }, [allTickets, searchQuery, filterBy]);

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const emptyState: EmptyStateConfig = {
    title: "No tickets available",
    buttonText: "Get your first ticket",
    buttonAction: () => navigate("/gifts"),
    heroImage: ActivityHero,
  };

  const config: GiftListConfig = {
    title: `All Tickets (${filteredTickets.length})`,
    ctaText: "",
    onCtaClick: () => {},
  };

  const handleItemClick = (item: TicketItem) => {
    navigate(`/tickets/viewdetails/${item.id}`);
  };

  // Define custom actions for tickets
  const ticketActions = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: "View Details",
      onClick: (item: GiftItem) => {
        navigate(`/tickets/viewdetails/${item.id}`);
      },
    },
    {
      icon: <TicketCheck className="h-4 w-4" />,
      label: "Use Ticket",
      onClick: (item: GiftItem) => {
        navigate(`/tickets/claim/${item.id}`);
      },
      show: (item: GiftItem) => {
        const ticketData = (item as TicketItem).ticketData;
        return ticketData?.status === "unused" || ticketData?.status === "paid";
      },
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "Booking Details",
      onClick: (item: GiftItem) => {
        const ticketData = (item as TicketItem).ticketData;
        const bookingId = ticketData?.bookingId || ticketData?._id;
        if (bookingId) {
          navigate(`/bookings/${bookingId}`);
        } else {
          // Handle case where bookingId is not available
          console.warn("Booking ID not found for ticket:", item.id);
        }
      },
      show: (item: GiftItem) => {
        const ticketData = (item as TicketItem).ticketData;
        return !!(ticketData?.bookingId || ticketData?._id);
      },
    },
  ];

  if (isTicketsError) {
    return (
      <section className="p-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Unable to load tickets. Please try again.
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
          All Tickets
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
            className="w-full rounded-xl bg-[#ECE6F0] py-3 px-10 text-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-[#49454F]" />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#49454F] hover:text-[#FF7A00]"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: "all", label: "All", count: allTickets.length },
          { key: "recent", label: "Recent", count: allTickets.length },
          {
            key: "unused",
            label: "Unused",
            count: allTickets.filter((t) => t.ticketData?.status === "unused")
              .length,
          },
          {
            key: "used",
            label: "Used",
            count: allTickets.filter((t) => t.ticketData?.status === "used")
              .length,
          },
          {
            key: "available",
            label: "Available",
            count: allTickets.filter(
              (t) =>
                t.ticketData?.status === "unused" ||
                t.ticketData?.status === "paid"
            ).length,
          },
          {
            key: "expired",
            label: "Expired",
            count: allTickets.filter((t) => t.ticketData?.status === "expired")
              .length,
          },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setFilterBy(filter.key as typeof filterBy)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              filterBy === filter.key
                ? "bg-[#FF7A00] text-white"
                : "bg-[#ECE6F0] text-black hover:bg-[#FF7A00]/10"
            }`}
          >
            {filter.label}{" "}
            <span className="bg-primary/10 p-1.5 px-3 rounded-lg">
              {filter.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Results Indicator */}
      {searchQuery && (
        <div className="mb-4 p-3 bg-[#E3F5FF] rounded-lg">
          <p className="text-sm text-gray-700">
            Showing {filteredTickets.length} result(s) for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Ticket List */}
      {isTicketsLoading ? (
        <TicketsSkeleton />
      ) : filteredTickets.length > 0 ? (
        <GiftList
          items={filteredTickets}
          config={config}
          emptyState={emptyState}
          onItemClick={handleItemClick}
          showActions={false}
          actions={ticketActions}
        />
      ) : (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No tickets found</p>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "Try adjusting your search terms"
                : "No tickets available at the moment"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default AllTicketView;
