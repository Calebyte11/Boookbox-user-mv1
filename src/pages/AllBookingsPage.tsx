/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { SegmentedControl } from "@radix-ui/themes";
import GiftList from "@/components/GiftList";
import TicketNearYou from "@/components/TicketNearYou";
import { canClaimBooking } from "@/utils/claim";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import {
  useGiftedBookingsQuery,
  useSelfBookingsQuery,
  useOthersBookingsQuery,
  usePublicBookingsQuery,
  useDeleteBooking,
  useTicketsQuery,
  useNearbyBookingsQuery,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks";
import { useLocationStore } from "@/store/locationStore";
import { sortByDistance, formatDistance } from "@/utils/locationUtils";
import Button from "@/components/Button";
import {
  Calendar,
  Edit3,
  Trash2,
  TicketCheck,
  Search,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
  BookingData,
} from "@/types/sponsor";
import type {
  EmptyTicketConfig,
  TicketListConfig,
  Ticket,
} from "@/types/ticket";
import { GiftsSkeleton, TicketsSkeleton } from "@/components/SkeletonLoader";

// Type alias for tickets displayed in the list
type TicketItem = GiftItem;

const AllBookingsPage = () => {
  const navigate = useNavigate();
  const { pathname: currentPath } = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const locationStore = useLocationStore();

  // Determine initial view from pathname or search params
  const getInitialView = (): "gifts" | "tickets" => {
    const viewParam = searchParams.get("view");
    if (viewParam) return viewParam as "gifts" | "tickets";
    if (currentPath.includes("/tickets")) return "tickets";
    return "gifts";
  };

  const initialView = getInitialView();

  // State management
  const [activeView, setActiveView] = useState<"gifts" | "tickets">(
    initialView
  );
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState<
    | "all"
    | "recent"
    | "self"
    | "others"
    | "gifted"
    | "public"
    | "active"
    | "inactive"
    | "paid"
    | "used"
    | "expired"
    | "claimed"
  >("all");
  const [loading, setLoading] = useState<boolean>(true);

  // Location data
  const location = locationStore.position;
  const ipLocation = locationStore.ipLocation;
  const hasLocation = locationStore.hasLocation;
  const geoLoading = locationStore.isLoadingGPS || locationStore.isLoadingIP;
  const geoError = locationStore.error;

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

  const hasAnyLocation = hasLocation || !!ipLocation;

  // Update URL when view changes
  useEffect(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("view", activeView);
    window.history.replaceState({}, "", newUrl);
  }, [activeView]);

  useEffect(() => {
    setLoading(false);
  }, []);

  // ==================== GIFTS QUERIES ====================
  const {
    data: giftedBookingsData,
    isLoading: isGiftedLoading,
    error: giftedError,
  } = useGiftedBookingsQuery();

  const {
    data: othersBookingsData,
    isLoading: isOthersLoading,
    error: othersError,
  } = useOthersBookingsQuery();

  const {
    data: selfBookingsData,
    isLoading: isSelfLoading,
    error: selfError,
  } = useSelfBookingsQuery();

  const {
    data: publicBookingsData,
    isLoading: isPublicLoading,
    error: publicError,
  } = usePublicBookingsQuery();

  // ==================== TICKETS QUERIES ====================
  const {
    data: ticketsData,
    isLoading: isTicketsLoading,
    isError: isTicketsError,
    error: ticketsError,
  } = useTicketsQuery();

  const {
    data: NearbyBooking,
    isLoading: isPublicBookingsLoadingTickets,
    isError: isPublicBookingsError,
    error: publicBookingsErrorTickets,
  } = useNearbyBookingsQuery({
    page: 1,
    limit: 10,
    latitude: coordinates?.latitude,
    longitude: coordinates?.longitude,
    enable: hasAnyLocation,
  });

  // ==================== DELETE MUTATION ====================
  const deleteBookingMutation = useDeleteBooking(bookingToDelete || "");

  // ==================== GIFTS TRANSFORMATIONS ====================
  const transformBookingsToGifts = useCallback(
    (bookings: BookingData[]): GiftItem[] => {
      return bookings.map((booking) => {
        const getBookingDescription = (booking: BookingData): string => {
          const bookingType = booking.bookingType || "others";
          const reason = booking.reason || "";

          switch (bookingType) {
            case "self":
              return reason || "Self booking";
            case "public":
              return reason || "Public booking";
            case "others":
              return reason || "Booking for others";
            default:
              return reason || "Meal booking";
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

        const getBookedForDisplay = (booking: BookingData): string => {
          if (!booking.bookedFor) return "Unspecified";

          if (typeof booking.bookedFor === "string") {
            return booking.bookedFor;
          }

          if (Array.isArray(booking.bookedFor?.contact)) {
            const names = booking.bookedFor.contact
              .map((c: any) => c.name || c.email)
              .filter(Boolean)
              .join(", ");
            return names || "Multiple recipients";
          }

          return "Unspecified";
        };

        return {
          id: booking._id,
          description: getBookingDescription(booking),
          image: booking.image || ActivityHero,
          reason: booking.reason,
          bookedFor: getBookedForDisplay(booking),
          bookedBy: booking.bookedByName,
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
          bookedAt: booking.bookedAt,
          customImage: booking.customImage,
          bookingData: booking,
        };
      });
    },
    [user]
  );

  const allGiftBookings = useMemo(
    () => [
      ...(Array.isArray(selfBookingsData?.data) ? selfBookingsData.data : []),
      ...(Array.isArray(giftedBookingsData?.data)
        ? giftedBookingsData.data
        : []),
      ...(Array.isArray(othersBookingsData?.data)
        ? othersBookingsData.data
        : []),
      ...(Array.isArray(publicBookingsData?.data)
        ? publicBookingsData.data
        : []),
    ],
    [
      selfBookingsData,
      giftedBookingsData,
      othersBookingsData,
      publicBookingsData,
    ]
  );

  const gifts: GiftItem[] = useMemo(
    () =>
      allGiftBookings.length > 0
        ? transformBookingsToGifts(allGiftBookings)
        : [],
    [allGiftBookings, transformBookingsToGifts]
  );

  const giftsIsLoading =
    isGiftedLoading || isOthersLoading || isPublicLoading || isSelfLoading;
  const giftsHasError = giftedError || othersError || publicError || selfError;

  // ==================== TICKETS TRANSFORMATIONS ====================
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
        .slice(0, 5)
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

    return tickets.slice(0, 10);
  };

  const ticketsNearby: Ticket[] = Array.isArray(NearbyBooking?.data)
    ? transformBookingsToTickets(NearbyBooking.data)
    : [];

  // ==================== FILTER & SEARCH LOGIC ====================
  const filteredGifts = useMemo(() => {
    if (!gifts || gifts.length === 0) return [];

    let filtered = [...gifts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (gift) =>
          gift.description?.toLowerCase().includes(query) ||
          gift.reason?.toLowerCase().includes(query) ||
          gift.bookedFor?.toLowerCase().includes(query) ||
          gift.bookedBy?.toLowerCase().includes(query) ||
          gift.statusText?.toLowerCase().includes(query)
      );
    }

    if (filterBy === "self") {
      filtered = filtered.filter(
        (gift) => gift.bookingData?.bookingType === "self"
      );
    } else if (filterBy === "others") {
      filtered = filtered.filter((gift) => {
        return gift.bookingData?.bookingType === "others";
      });
    } else if (filterBy === "gifted") {
      filtered = filtered.filter((gift) => {
        return (
          user?.email &&
          Array.isArray(gift.bookingData?.bookedFor?.contact) &&
          gift.bookingData.bookedFor.contact.some(
            (recipient: any) =>
              recipient?.email &&
              recipient.email.toLowerCase() === user?.email.toLowerCase()
          )
        );
      });
    } else if (filterBy === "public") {
      filtered = filtered.filter(
        (gift) => gift.bookingData?.bookingType === "public"
      );
    } else if (filterBy === "active") {
      filtered = filtered.filter((gift) => gift.status === "active");
    } else if (filterBy === "inactive") {
      filtered = filtered.filter((gift) => gift.status === "inactive");
    } else if (filterBy === "paid") {
      filtered = filtered.filter((gift) => gift.bookingData?.status === "paid");
    } else if (filterBy === "used") {
      filtered = filtered.filter((gift) => gift.bookingData?.status === "used");
    } else if (filterBy === "expired") {
      filtered = filtered.filter(
        (gift) => gift.bookingData?.status === "expired"
      );
    } else if (filterBy === "claimed") {
      filtered = filtered.filter(
        (gift) => gift.bookingData?.status === "claimed"
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(
        a.bookingData?.bookedAt || a.bookingData?.createdAt || 0
      ).getTime();
      const dateB = new Date(
        b.bookingData?.bookedAt || b.bookingData?.createdAt || 0
      ).getTime();

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    });

    return filtered;
  }, [gifts, searchQuery, filterBy, user]);

  // ==================== EVENT HANDLERS ====================
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      await deleteBookingMutation.mutateAsync();

      toast({
        title: "Gift booking deleted successfully!",
        description: "The gift booking has been removed.",
        variant: "success",
      });

      await queryClient.invalidateQueries({
        queryKey: ["bookings"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["giftedBookings"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["selfBookings"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["othersBookings"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["publicBookings"],
      });

      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "error",
        duration: 2000,
      });
    }
  };

  const handleClaimBooking = (item: GiftItem) => {
    const booking = item.bookingData;
    if (!booking) {
      toast({
        title: "Error",
        description: "Booking data not available.",
        variant: "error",
      });
      return;
    }

    const canClaim = canClaimBooking(user, booking);

    if (!canClaim) {
      toast({
        title: "Cannot Claim",
        description: "This ticket is not available for you to claim.",
        variant: "info",
        duration: 2000,
      });
      return;
    }

    navigate(`/tickets/claim/${booking.bookingId}`);
  };

  const openDeleteDialog = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setIsDeleteDialogOpen(true);
  };

  const handleItemClick = (item: GiftItem) => {
    navigate(`/bookings/${item.bookingData?.bookingId || item.id}`);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const getFilterTitle = () => {
    switch (filterBy) {
      case "self":
        return "Self Bookings";
      case "others":
        return "Bookings for Others";
      case "gifted":
        return "Gifted to Me";
      case "public":
        return "Public Bookings";
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "paid":
        return "Paid";
      case "used":
        return "Used";
      case "expired":
        return "Expired";
      case "claimed":
        return "Claimed";
      case "recent":
        return "Recent";
      default:
        return "All Gifts";
    }
  };

  // ==================== GIFT ACTIONS ====================
  const giftActions = [
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "View Details",
      onClick: (item: GiftItem) =>
        navigate(`/bookings/${item.bookingData?.bookingId || item.id}`),
    },
    {
      icon: <TicketCheck className="h-4 w-4" />,
      label: "Claim Ticket",
      onClick: handleClaimBooking,
      show: (item: GiftItem) => {
        const booking = item.bookingData;
        if (!booking) return false;

        return (
          booking.status === "paid" && booking.bookedById !== user?.id
        );
      },
    },
    {
      icon: <Edit3 className="h-4 w-4" />,
      label: "Edit Gift",
      onClick: (item: GiftItem) =>
        navigate(`/bookings/${item.bookingData?.bookingId || item.id}/edit`),
      show: (item: GiftItem) => {
        const booking = item.bookingData;
        if (!booking || !user) return false;

        return booking.bookedById === user?.id && booking.status !== "paid";
      },
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete Gift",
      onClick: (item: GiftItem) =>
        openDeleteDialog(item.bookingData?.bookingId || (item.id as string)),
      variant: "danger" as const,
      show: (item: GiftItem) => {
        const booking = item.bookingData;
        if (!booking || !user) return false;

        return booking.bookedById === user.id && booking.status !== "paid";
      },
    },
  ];

  const giftConfig: GiftListConfig = {
    title: `${getFilterTitle()}`,
    ctaText: "",
    link: "/bookings/gifts",
  };

  const giftEmptyState: EmptyStateConfig = {
    title: "It seems you're yet to gift any meal",
    buttonText: "Gift your first Meal",
    buttonAction: () => {
      navigate("/home");
    },
    heroImage: ActivityHero,
  };

  const ticketConfig: GiftListConfig = {
    title: "My Ticket",
    ctaText: "View all",
    link: "/tickets/view-all",
    onCtaClick: () => navigate(`/tickets/view-all`),
  };

  const ticketEmptyState: EmptyStateConfig = {
    title: "No ticket available",
    buttonText: "Ticket to your first package",
    buttonAction: () => navigate("/gifts"),
    heroImage: ActivityHero,
  };

  const emptyTicket: EmptyTicketConfig = {
    title: "No tickets available",
    buttonText: "Explore Tickets",
    buttonAction: () => console.log("Navigate to explore tickets"),
    heroImage: ActivityHero,
  };

  const ticketNearbyConfig: TicketListConfig = {
    title: "Tickets Near You",
    ctaText: "",
    link: "/tickets/near-you",
    onCtaClick: () => navigate(`/tickets/near-you`),
  };

  const filterTabs = [
    { key: "all", label: "All", count: gifts.length },
    { key: "recent", label: "Recent", count: gifts.length },
    {
      key: "self",
      label: "Self",
      count: gifts.filter((g) => g.bookingData?.bookingType === "self").length,
    },
    {
      key: "gifted",
      label: "Gifted",
      count: gifts.filter(
        (g) =>
          user?.email &&
          Array.isArray(g.bookingData?.bookedFor?.contact) &&
          g.bookingData.bookedFor.contact.some(
            (recipient: any) =>
              recipient?.email &&
              recipient.email.toLowerCase() === user?.email.toLowerCase()
          )
      ).length,
    },
    {
      key: "others",
      label: "Others",
      count: gifts.filter((g) => g.bookingData?.bookingType === "others").length,
    },
    {
      key: "public",
      label: "Public",
      count: gifts.filter((g) => g.bookingData?.bookingType === "public").length,
    },
    {
      key: "active",
      label: "Active",
      count: gifts.filter((g) => g.status === "active").length,
    },
    {
      key: "paid",
      label: "Paid",
      count: gifts.filter((g) => g.bookingData?.status === "paid").length,
    },
  ];

  // ==================== ERROR HANDLING ====================
  if (giftsHasError && activeView === "gifts") {
    console.error("Gift loading error:", {
      giftedError,
      othersError,
      publicError,
    });

    return (
      <section className="p-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Unable to load gifts. Please try again.
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

  // ==================== RENDER ====================
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
          All Bookings
        </h1>
      </div>

      {/* Segmented Control for Gifts and Tickets */}
      <div className="mt-4 mb-6 flex justify-center w-full">
        <SegmentedControl.Root
          value={activeView}
          onValueChange={(value) => {
            setActiveView(value as "gifts" | "tickets");
            setSearchQuery("");
            setFilterBy("all");
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

      {/* GIFTS VIEW */}
      {activeView === "gifts" && (
        <div className="animate-fade-in">
          {/* Search Bar */}
          <div className="mb-4">
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Search gifts..."
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
            {filterTabs.map((filter) => (
              <button
                key={filter.key}
                onClick={() =>
                  setFilterBy(filter.key as typeof filterBy)
                }
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
                Showing {filteredGifts.length} result(s) for "{searchQuery}"
              </p>
            </div>
          )}

          {/* Gift List */}
          {giftsIsLoading ? (
            <GiftsSkeleton />
          ) : filteredGifts.length > 0 ? (
            <GiftList
              items={filteredGifts}
              config={giftConfig}
              emptyState={giftEmptyState}
              onItemClick={handleItemClick}
              showActions={filteredGifts.length > 0}
              actions={giftActions}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No gifts found</p>
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "No gifts available at the moment"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TICKETS VIEW */}
      {activeView === "tickets" && (
        <div className="animate-fade-in">
          {isTicketsError && (
            <p className="text-red-600 mb-4">
              Error loading tickets: {ticketsError?.message}
            </p>
          )}

          {isTicketsLoading ? (
            <TicketsSkeleton />
          ) : (
            !isTicketsError && (
              <GiftList
                items={myTickets}
                config={ticketConfig}
                emptyState={ticketEmptyState}
                onItemClick={(item) => {
                  if (item.id) {
                    navigate(`/tickets/viewdetails/${item.id}`);
                  }
                }}
              />
            )
          )}

          <div className="mt-8">
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
                <p className="text-sm text-gray-600 mt-2">
                  Showing default tickets instead
                </p>
              </div>
            ) : isPublicBookingsLoadingTickets ? (
              <TicketsSkeleton />
            ) : isPublicBookingsError ? (
              <div className="text-center p-4">
                <p className="text-red-600">
                  Error loading tickets: {publicBookingsErrorTickets?.message}
                </p>
              </div>
            ) : (
              <div className="">
                <TicketNearYou
                  items={ticketsNearby.length > 0 ? ticketsNearby : []}
                  emptyState={emptyTicket}
                  config={ticketNearbyConfig}
                  onItemClick={(item: Ticket) =>
                    navigate(`/tickets/claim/${item.id}`)
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg z-50">
            <Dialog.Title className="text-xl font-semibold mb-4 text-red-600">
              Delete Gift
            </Dialog.Title>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this gift booking? This action
              cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button
                  type="button"
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteBooking}
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending
                  ? "Deleting..."
                  : "Delete Gift"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
};

export default AllBookingsPage;
