/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import GiftList from "@/components/GiftList";
import { canClaimBooking} from "@/utils/claim"
import ActivityHero from "@/assets/images/sponsorbanner.png";
import {
  useGiftedBookingsQuery,
  useSelfBookingsQuery,
  useOthersBookingsQuery,
  usePublicBookingsQuery,
  useDeleteBooking,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks";
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
// import LoadingSpinner from "@/components/LoadingSpinner";
import { GiftsSkeleton } from "@/components/SkeletonLoader";
const Gifts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
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
  // Fetch gifted bookings and bookings for others
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
  // Fetch public bookings (optional, can be used for public gifting)
  const {
    data: publicBookingsData,
    isLoading: isPublicLoading,
    error: publicError,
    // isError: isPublicError,
  } = usePublicBookingsQuery();

  // Add detailed logging for debugging
  // console.log("👥 booking query result:", {
  //   others: othersBookingsData?.data,
  //   self: selfBookingsData?.data,
  //   public: publicBookingsData?.data,
  // });
  // Mutation hooks
  const deleteBookingMutation = useDeleteBooking(bookingToDelete || "");

  // Transform booking data to gift format
  const transformBookingsToGifts = useCallback(
    (bookings: BookingData[]): GiftItem[] => {
      return bookings.map((booking) => {
        // Generate better descriptions based on booking type
        const getBookingDescription = (booking: BookingData): string => {
          const bookedForType = booking.bookingType;

          // Check if this booking was created by someone else (not the current user)
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
            return `Gift from ${booking.bookedByName || "someone"}`;
          }

          switch (bookedForType) {
            case "self":
              return "Reserved by you";
            case "others":
              return `Gifted to someone special`;
            case "public":
              return "Available for public claim";
            default:
              return `${isGiftedByOthers ? "Received gift" : "Meal booking"}`;
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
          const bookedForType = booking.bookingType;

          // Check if this booking was created by someone else (not the current user)
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

          switch (bookedForType) {
            case "self":
              return "Personal reservation";
            case "others":
              return "Gift for others";
            case "public":
              return "Public gift";
            default:
              return "Meal booking";
          }
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
          
          // Add booking data for actions
          bookingData: booking,
        };
      });
    },
    [user]
  ); // Combine and transform all gift-related bookings including public bookings
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

  // Safety check to ensure we have valid data and memoize gifts
  const gifts: GiftItem[] = useMemo(
    () =>
      allGiftBookings.length > 0
        ? transformBookingsToGifts(allGiftBookings)
        : [],
    [allGiftBookings, transformBookingsToGifts]
  );
  const isLoading =
    isGiftedLoading || isOthersLoading || isPublicLoading || isSelfLoading;
  const hasError = giftedError || othersError || publicError || selfError;

  const emptyState: EmptyStateConfig = {
    title: "It seems you're yet to gift any meal",
    buttonText: "Gift your first Meal",
    buttonAction: () => {
      navigate("/restaurants");
    },
    heroImage: ActivityHero,
  }; // Dynamic title based on filter
  const getFilterTitle = () => {
    switch (filterBy) {
      case "self":
        return "Your Personal Gifts";
      case "others":
        return "Gifts for Others";
      case "gifted":
        return "Gifts Received from Others";
      case "public":
        return "Public Gifts";
      case "active":
        return "Active Gifts";
      case "inactive":
        return "Inactive Gifts";
      case "paid":
        return "Paid Gifts";
      case "used":
        return "Used Gifts";
      case "expired":
        return "Expired Gifts";
      case "claimed":
        return "Claimed Gifts";
      case "recent":
        return "Recent Gifts";
      default:
        return "All Gifts";
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      await deleteBookingMutation.mutateAsync();

      toast({
        title: "Gift booking deleted successfully!",
        description: "The gift booking has been removed.",
        variant: "success",
      });

      // Invalidate and refetch all booking queries to update the UI
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
  // Handle claim booking
 


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

    // Navigate to claim ticket view
    navigate(`/tickets/claim/${booking.bookingId}`);
  };

  // Open delete dialog
  const openDeleteDialog = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setIsDeleteDialogOpen(true);
  };
  const handleItemClick = (item: GiftItem) => {
    
    // Navigate to booking details or gift details page using proper booking ID
    navigate(`/bookings/${item.bookingData?.bookingId || item.id}`);
  }; // Define custom actions for the gift list
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
      onClick: handleClaimBooking, // Show claim option for paid bookings that can be claimed
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
        navigate(`/bookings/${item.bookingData?.bookingId || item.id}/edit`), // Show edit option only for non-paid bookings created by the current user
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
      variant: "danger" as const, // Show delete option only for non-paid bookings created by the current user
      show: (item: GiftItem) => {
        const booking = item.bookingData;
        if (!booking || !user) return false;

        return booking.bookedById === user.id && booking.status !== "paid";
      },
    },
  ];
  // Filter and search logic
  const filteredGifts = useMemo(() => {
    if (!gifts || gifts.length === 0) return [];

    let filtered = [...gifts];

    // Apply search filter
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

    // Apply filter by type
    if (filterBy === "self") {
      filtered = filtered.filter(
        (gift) => gift.bookingData?.bookingType === "self"
      );
    } else if (filterBy === "others") {
      filtered = filtered.filter(
        (gift) => {
          // "Others" means gifts the user has given to others (not self, not public)
          // Show gifts where bookingType is "others" and the current user is the giver
          if (!user) return false;
          return (
        gift.bookingData?.bookingType === "others" &&
        (
          gift.bookingData?.bookedById === user.id ||
          (user.email &&
            gift.bookingData?.bookedByUser?.email &&
            gift.bookingData.bookedByUser.email.toLowerCase() === user.email.toLowerCase())
        )
          );
        });

      } else if (filterBy === "gifted") {
      filtered = filtered.filter(
        (gift) => {
          // "Gifted" means gifts the user has received from others (bookingType "others" or "self" but not created by user)
          if (!user) return false;
          const isGiftedByOthers =
        (user.id && gift.bookingData?.bookedById !== user.id) ||
        user?.email &&
                Array.isArray(gift.bookingData?.bookedFor?.contact) &&
                gift.bookingData.bookedFor.contact.some(
                  (recipient: any) =>
                    recipient?.email &&
                    recipient.email.toLowerCase() === user?.email.toLowerCase()
                )
          return (
        (gift.bookingData?.bookingType === "others" || gift.bookingData?.bookingType === "self") &&
        isGiftedByOthers
          );
        }
      )} else if (filterBy === "public") {
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

    // Always sort by most recent first, regardless of filter
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

  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const config: GiftListConfig = {
    title: `${getFilterTitle()}`,
    ctaText: "",
    link: "/bookings/gifts",
  };

  if (hasError) {
    // Log the actual error for debugging purposes
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
          All Gifts{" "}
          {/* <span className="bg-primary/10 px-3 py-1.5 rounded-lg">
            {filteredGifts.length}
          </span> */}
        </h1>
      </div>
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
        {[
          { key: "all", label: "All", count: gifts.length },
          { key: "recent", label: "Recent", count: gifts.length },
          {
            key: "self",
            label: "Self",
            count: gifts.filter((g) => g.bookingData?.bookingType === "self")
              .length,
          },
          {
            key: "gifted",
            label: "Gifted",
            count: gifts.filter(
              (g) =>
                // g.bookingData?.bookingType === "others" &&
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
            count: gifts.filter((g) => g.bookingData?.bookingType === "others")
              .length,
          },
          {
            key: "public",
            label: "Public",
            count: gifts.filter((g) => g.bookingData?.bookingType === "public")
              .length,
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
            Showing {filteredGifts.length} result(s) for "{searchQuery}"
          </p>
        </div>
      )}{" "}
      {/* Gift List */}
      {isLoading ? (
        <GiftsSkeleton />
      ) : filteredGifts.length > 0 ? (
        <GiftList
          items={filteredGifts}
          config={config}
          emptyState={emptyState}
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

export default Gifts;
