import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GiftList from "@/components/GiftList";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import {
  useDeleteBooking,
  useSelfBookingsQuery,
  useOthersBookingsQuery,
  useGiftedBookingsQuery,
  usePublicBookingsQuery,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import Button from "@/components/Button";
import { Calendar, Edit3, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
  BookingData,
} from "@/types/sponsor";

const AllGiftView = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch all booking types

  const {
    data: selfBookingsData,
    isLoading: isSelfLoading,
    error: selfError,
  } = useSelfBookingsQuery();

  const {
    data: othersBookingsData,
    isLoading: isOthersLoading,
    error: othersError,
  } = useOthersBookingsQuery();

  const {
    data: giftedBookingsData,
    isLoading: isGiftedLoading,
    error: giftedError,
  } = useGiftedBookingsQuery();

  const {
    data: publicBookingsData,
    isLoading: isPublicLoading,
    error: publicError,
  } = usePublicBookingsQuery();
  // Mutation hooks
  const deleteBookingMutation = useDeleteBooking(bookingToDelete || "");

  // Transform booking data to gift format
  const transformBookingsToGifts = (bookings: BookingData[]): GiftItem[] => {
    return bookings.map((booking) => ({
      id: booking.bookingId || booking._id, // Use bookingId
      description: `${booking.reason} - Booked by ${booking.bookedByName}`,
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
      // Add booking data for actions
      bookingData: booking,
    }));
  }; // Combine all bookings from different sources
  // Note: allBookingsData may have direct access to arrays based on API response structure
  const allCombinedBookings = [
    ...(Array.isArray(selfBookingsData?.data) ? selfBookingsData.data : []),
    ...(Array.isArray(othersBookingsData?.data) ? othersBookingsData.data : []),
    ...(Array.isArray(giftedBookingsData?.data) ? giftedBookingsData.data : []),
    ...(Array.isArray(publicBookingsData?.data) ? publicBookingsData.data : []),
  ];

  // Remove duplicates based on booking ID
  const uniqueBookings = allCombinedBookings.filter(
    (booking, index, self) =>
      index === self.findIndex((b) => b._id === booking._id)
  );

  // Transform to gift items
  const gifts: GiftItem[] =
    uniqueBookings.length > 0 ? transformBookingsToGifts(uniqueBookings) : [];

  const isLoading =
    isSelfLoading || isOthersLoading || isGiftedLoading || isPublicLoading;

  const hasError = selfError || othersError || giftedError || publicError;

  const emptyState: EmptyStateConfig = {
    title: "No bookings found",
    buttonText: "Create your first booking",
    buttonAction: () => {
      navigate("/restaurants");
    },
    heroImage: ActivityHero,
  };

  const config: GiftListConfig = {
    title: "All Bookings",
    ctaText: "Create New",
    onCtaClick: () => {
      navigate("/restaurants");
    },
  };

  // Handle delete booking
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      await deleteBookingMutation.mutateAsync();

      toast({
        title: "Booking deleted successfully!",
        description: "The booking has been removed.",
        variant: "success",
      });

      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  // Open delete dialog
  const openDeleteDialog = (bookingId: string) => {
    setBookingToDelete(bookingId);
    setIsDeleteDialogOpen(true);
  };
  const handleItemClick = (item: GiftItem) => {
    // Navigate to booking details page using proper booking ID
    navigate(`/bookings/${item.bookingData?.bookingId || item.id}`);
  };

  // Define custom actions for the booking list
  const bookingActions = [
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "View Details",
      onClick: (item: GiftItem) => {
        const bookingId = item.bookingData?.bookingId || item.id;
        if (bookingId) {
          navigate(`/bookings/${bookingId}`);
        } else {
          console.warn("Booking ID not found for item:", item.id);
        }
      },
    },
    {
      icon: <Edit3 className="h-4 w-4" />,
      label: "Edit Booking",
      onClick: (item: GiftItem) => {
        const bookingId = item.bookingData?.bookingId || item.id;
        if (bookingId) {
          navigate(`/bookings/${bookingId}/edit`);
        } else {
          toast({
            title: "Cannot edit booking",
            description: "Booking ID not found.",
            variant: "error",
          });
        }
      },
      show: (item: GiftItem) => {
        // Only show edit for pending bookings
        return item.bookingData?.status === "pending";
      },
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete Booking",
      onClick: (item: GiftItem) => {
        const bookingId = item.bookingData?.bookingId || (item.id as string);
        if (bookingId) {
          openDeleteDialog(bookingId);
        } else {
          toast({
            title: "Cannot delete booking",
            description: "Booking ID not found.",
            variant: "error",
          });
        }
      },
      variant: "danger" as const,
      show: (item: GiftItem) => {
        // Only show delete for pending bookings
        return item.bookingData?.status === "pending";
      },
    },
  ];

  if (hasError) {
    // Log the actual error for debugging purposes
    console.error("Booking loading error:", {
      selfError,
      othersError,
      giftedError,
      publicError,
    });

    return (
      <section className="p-4">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Unable to load bookings. Please try again.
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
    <section className="">
      {isLoading ? (
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, idx) => (
              <div
          key={idx}
          className="flex items-center gap-4 animate-pulse bg-white rounded-lg shadow-sm p-4"
              >
          <div className="w-16 h-16 bg-gray-200 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded" />
            <div className="w-8 h-8 bg-gray-200 rounded" />
          </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <GiftList
          items={gifts}
          config={config}
          emptyState={emptyState}
          onItemClick={handleItemClick}
          showActions={gifts.length > 0}
          actions={bookingActions}
          showTimeAgo={true}
        />
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
              Delete Booking
            </Dialog.Title>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this booking? This action cannot
              be undone.
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
                  : "Delete Booking"}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
};

export default AllGiftView;
