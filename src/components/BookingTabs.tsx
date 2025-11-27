/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GiftList from "@/components/GiftList";
import ActivityHero from "@/assets/images/sponsorbanner.png";
import {
  useAllBookingsQuery,
  useSelfBookingsQuery,
  useOthersBookingsQuery,
  useGiftedBookingsQuery,
  usePublicBookingsQuery,
  useDeleteBooking,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import Button from "@/components/Button";
import { Calendar, Edit3, Trash2, Loader2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Tabs from "@radix-ui/react-tabs";
import type {
  GiftItem,
  GiftListConfig,
  EmptyStateConfig,
} from "@/types/sponsor";

const BookingTabs: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Individual booking queries
  const allBookingsQuery = useAllBookingsQuery();
  const selfBookingsQuery = useSelfBookingsQuery();
  const othersBookingsQuery = useOthersBookingsQuery();
  const giftedBookingsQuery = useGiftedBookingsQuery();
  const publicBookingsQuery = usePublicBookingsQuery();

  // Mutation hook
  const deleteBookingMutation = useDeleteBooking(bookingToDelete || "");

  // Transform booking data to gift format
  const transformBookingsToGifts = (bookings: any[]): GiftItem[] => {
    if (!Array.isArray(bookings)) return [];

    return bookings.map((booking) => ({
      id: booking.id,
      description: `${booking.restaurant?.name || "Restaurant"} - ${
        booking.menuItems?.[0]?.name || "Meal"
      }`,
      image: booking.restaurant?.image || booking.image || ActivityHero,
      status: booking.status === "active" ? "active" : "inactive",
      statusText: booking.status === "active" ? "Active" : "Completed",
      bookingData: booking,
    }));
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
    navigate(`/bookings/${item.id}`);
  };

  // Define custom actions
  const bookingActions = [
    {
      icon: <Calendar className="h-4 w-4" />,
      label: "View Details",
      onClick: (item: GiftItem) => navigate(`/bookings/${item.id}`),
    },
    {
      icon: <Edit3 className="h-4 w-4" />,
      label: "Edit Booking",
      onClick: (item: GiftItem) => navigate(`/bookings/${item.id}/edit`),
    },
    {
      icon: <Trash2 className="h-4 w-4" />,
      label: "Delete Booking",
      onClick: (item: GiftItem) => openDeleteDialog(item.id as string),
      variant: "danger" as const,
    },
  ];

  // Define tab configurations
  const tabConfigs = {
    all: {
      query: allBookingsQuery,
      title: "All Bookings",
      emptyTitle: "No bookings found",
    },
    self: {
      query: selfBookingsQuery,
      title: "My Bookings",
      emptyTitle: "You haven't made any bookings yet",
    },
    others: {
      query: othersBookingsQuery,
      title: "Bookings for Others",
      emptyTitle: "No bookings for others found",
    },
    gifted: {
      query: giftedBookingsQuery,
      title: "Gifted Meals",
      emptyTitle: "No gifted meals found",
    },
    public: {
      query: publicBookingsQuery,
      title: "Public Bookings",
      emptyTitle: "No public bookings found",
    },
  };

  const renderTabContent = (tabKey: keyof typeof tabConfigs) => {
    const config = tabConfigs[tabKey];
    const { data, isLoading, error } = config.query;

    const bookings = Array.isArray(data?.data) ? data.data : [];
    const gifts = transformBookingsToGifts(bookings);

    const emptyState: EmptyStateConfig = {
      title: config.emptyTitle,
      buttonText: "Create Booking",
      buttonAction: () => navigate("/restaurants"),
      heroImage: ActivityHero,
    };

    const listConfig: GiftListConfig = {
      title: config.title,
      ctaText: "Create New",
      onCtaClick: () => navigate("/restaurants"),
    };

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">
            Failed to load {config.title.toLowerCase()}
          </p>
          <Button
            className="bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">
            Loading {config.title.toLowerCase()}...
          </span>
        </div>
      );
    }

    return (
      <GiftList
        items={gifts}
        config={listConfig}
        emptyState={emptyState}
        onItemClick={handleItemClick}
        showActions={gifts.length > 0}
        actions={bookingActions}
      />
    );
  };

  return (
    <section className="">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-gray-200 mb-6">
          {Object.entries(tabConfigs).map(([key, config]) => (
            <Tabs.Trigger
              key={key}
              value={key}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {config.title}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {Object.keys(tabConfigs).map((key) => (
          <Tabs.Content key={key} value={key}>
            {renderTabContent(key as keyof typeof tabConfigs)}
          </Tabs.Content>
        ))}
      </Tabs.Root>

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

export default BookingTabs;
