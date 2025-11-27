/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Edit3,
  Trash2,
  MoreHorizontal,
  Calendar,
  MapPin,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import Button from "@/components/Button";
import {
  useAllBookingsQuery,
  useUpdateBooking,
  useDeleteBooking,
  useSelfBookingsQuery,
  useOthersBookingsQuery,
  useGiftedBookingsQuery,
  usePublicBookingsQuery,
} from "@/hooks/useUserQueries";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useForm, type SubmitHandler } from "react-hook-form";
import FormField from "@/components/FormField";
import { useToast } from "@/hooks/useToast";
import type { BookingUpdateBody } from "@/services/usersService";

interface BookingFilters {
  search: string;
  status: "all" | "active" | "completed" | "cancelled";
  type: "all" | "self" | "others" | "public" | "gifts";
}

interface UpdateBookingForm {
  reason?: string;
  validityDate: string;
  numberOfBookings: number;
}

const BookingsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<BookingFilters>({
    search: "",
    status: "all",
    type: "all",
  });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // Computed state for modals
  const isUpdateModalOpen = !!selectedBooking;
  const isDeleteDialogOpen = !!bookingToDelete;

  // Form for updating bookings
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateBookingForm>();

  // Query hooks for different booking types
  const {
    data: allBookingsData,
    isLoading: isAllBookingsLoading,
    error: allBookingsError,
  } = useAllBookingsQuery({
    page: 1,
    limit: 50,
    status: filters.status !== "all" ? filters.status : undefined,
  });

  const { data: selfBookingsData, isLoading: isSelfBookingsLoading } =
    useSelfBookingsQuery({
      page: 1,
      limit: 50,
      status: filters.status !== "all" ? filters.status : undefined,
    });

  const { data: othersBookingsData, isLoading: isOthersBookingsLoading } =
    useOthersBookingsQuery({
      page: 1,
      limit: 50,
      status: filters.status !== "all" ? filters.status : undefined,
    });

  const { data: giftedBookingsData, isLoading: isGiftedBookingsLoading } =
    useGiftedBookingsQuery({
      page: 1,
      limit: 50,
    });

  const { data: publicBookingsData, isLoading: isPublicBookingsLoading } =
    usePublicBookingsQuery({
      page: 1,
      limit: 50,
      status: filters.status !== "all" ? filters.status : undefined,
    });

  // Mutation hooks
  const updateBookingMutation = useUpdateBooking(selectedBooking?._id || selectedBooking?.bookingId || "");
  const deleteBookingMutation = useDeleteBooking(bookingToDelete || "");

  // Get the appropriate data based on filter type
  const getCurrentBookingsData = () => {
    switch (filters.type) {
      case "self":
        return { data: selfBookingsData, isLoading: isSelfBookingsLoading };
      case "others":
        return { data: othersBookingsData, isLoading: isOthersBookingsLoading };
      case "gifts":
        return { data: giftedBookingsData, isLoading: isGiftedBookingsLoading };
      case "public":
        return { data: publicBookingsData, isLoading: isPublicBookingsLoading };
      default:
        return { data: allBookingsData, isLoading: isAllBookingsLoading };
    }
  };

  const { data: currentBookingsData, isLoading } = getCurrentBookingsData();

  // Transform and filter bookings
  const bookings = Array.isArray(currentBookingsData?.data)
    ? currentBookingsData.data.filter((booking: any) => {
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          return (
            booking.restaurant?.name?.toLowerCase().includes(searchTerm) ||
            booking.bookedAtRestaurant?.name?.toLowerCase().includes(searchTerm) ||
            booking.reason?.toLowerCase().includes(searchTerm) ||
            booking.bookedFor?.type?.toLowerCase().includes(searchTerm)
          );
        }
        return true;
      })
    : [];

  // Handle update booking
  const handleUpdateBooking: SubmitHandler<UpdateBookingForm> = async (
    data
  ) => {
    if (!selectedBooking) return;

    try {
      const updateData: BookingUpdateBody = {
        reason: data.reason,
        validityDate: new Date(data.validityDate).toISOString(),
        numberOfBookings: data.numberOfBookings,
      };

      await updateBookingMutation.mutateAsync(updateData);

      toast({
        title: "Booking updated successfully!",
        description: "Your booking has been updated.",
        variant: "success",
      });

      setSelectedBooking(null);
      reset();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  // Handle delete booking
  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;

    try {
      await deleteBookingMutation.mutateAsync();

      toast({
        title: "Booking deleted successfully!",
        description: "Your booking has been removed.",
        variant: "success",
      });

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

  // Open update modal and populate form
  const openUpdateModal = (booking: any) => {
    setSelectedBooking(booking);
    reset({
      reason: booking.reason || "",
      validityDate: booking.validityDate
        ? (typeof booking.validityDate === 'string' 
            ? new Date(booking.validityDate).toISOString().split("T")[0]
            : booking.validityDate.stop 
              ? new Date(booking.validityDate.stop).toISOString().split("T")[0]
              : new Date(booking.validityDate.start).toISOString().split("T")[0])
        : "",
      numberOfBookings: booking.numberOfBookings || 1,
    });
  };

  // Close modals
  const setIsUpdateModalOpen = (open: boolean) => {
    if (!open) {
      setSelectedBooking(null);
      reset();
    }
  };

  const setIsDeleteDialogOpen = (open: boolean) => {
    if (!open) {
      setBookingToDelete(null);
    }
  };

  // Open delete dialog
  const openDeleteDialog = (bookingId: string) => {
    setBookingToDelete(bookingId);
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "confirmed":
        return {
          color: "text-green-600 bg-green-50",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Active",
        };
      case "completed":
        return {
          color: "text-blue-600 bg-blue-50",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Completed",
        };
      case "cancelled":
        return {
          color: "text-red-600 bg-red-50",
          icon: <X className="w-4 h-4" />,
          text: "Cancelled",
        };
      case "pending":
        return {
          color: "text-yellow-600 bg-yellow-50",
          icon: <Clock className="w-4 h-4" />,
          text: "Pending",
        };
      default:
        return {
          color: "text-gray-600 bg-gray-50",
          icon: <AlertCircle className="w-4 h-4" />,
          text: status || "Unknown",
        };
    }
  };

  if (allBookingsError) {
    return (
      <section className="p-4">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load bookings</p>
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
    <section className="p-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">My Bookings</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => navigate("/restaurants")}
          >
            <Calendar className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings by restaurant, reason, or recipient..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Filter Tabs */}
        <Tabs.Root
          value={filters.type}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, type: value as any }))
          }
        >
          <Tabs.List className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <Tabs.Trigger
              value="all"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              All Bookings
            </Tabs.Trigger>
            <Tabs.Trigger
              value="self"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Personal
            </Tabs.Trigger>
            <Tabs.Trigger
              value="others"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              For Others
            </Tabs.Trigger>
            <Tabs.Trigger
              value="gifts"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Gifts
            </Tabs.Trigger>
            <Tabs.Trigger
              value="public"
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Public
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto">
          <Button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === "all"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() => setFilters((prev) => ({ ...prev, status: "all" }))}
          >
            All Status
          </Button>
          <Button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === "active"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() =>
              setFilters((prev) => ({ ...prev, status: "active" }))
            }
          >
            Active
          </Button>
          <Button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === "completed"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() =>
              setFilters((prev) => ({ ...prev, status: "completed" }))
            }
          >
            Completed
          </Button>
          <Button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filters.status === "cancelled"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            onClick={() =>
              setFilters((prev) => ({ ...prev, status: "cancelled" }))
            }
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-500 mb-6">
                {filters.search ||
                filters.status !== "all" ||
                filters.type !== "all"
                  ? "Try adjusting your filters to see more results"
                  : "You haven't made any bookings yet"}
              </p>
              <Button
                className="bg-primary text-white px-6 py-3 rounded-lg"
                onClick={() => navigate("/restaurants")}
              >
                Make Your First Booking
              </Button>
            </div>
          ) : (
            bookings.map((booking: any) => {
              const statusDisplay = getStatusDisplay(booking.status);

              return (
                <div
                  key={booking._id || booking.bookingId}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Restaurant and Menu Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {(booking.restaurant?.image || booking.bookedAtRestaurant?.profileImage) ? (
                            <img
                              src={
                                booking.restaurant?.image ||
                                booking.bookedAtRestaurant?.profileImage ||
                                "/placeholder-restaurant.png"
                              }
                              alt={booking.restaurant?.name || booking.bookedAtRestaurant?.name || "Restaurant"}
                              className="w-full h-full rounded-lg object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextSibling) nextSibling.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-primary/10 rounded-lg flex items-center justify-center text-primary font-medium">
                            {(booking.restaurant?.name || booking.bookedAtRestaurant?.name)?.charAt(0) || "R"}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {booking.restaurant?.name || booking.bookedAtRestaurant?.name || "Restaurant"}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.restaurant?.address ||
                              booking.bookedAtRestaurant?.address ||
                              "Address not available"}
                          </p>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Booking Type
                          </p>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {booking.bookingType || booking.bookedFor?.type || "Personal"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Quantity
                          </p>
                          <p className="text-sm font-medium">
                            {booking.numberOfBookings || 1} meal(s)
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Total Amount
                          </p>
                          <p className="text-sm font-medium">
                            {booking.currency || 'NGN'} {booking.totalAmount?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>

                      {/* Additional Info */}
                      {booking.reason && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Reason
                          </p>
                          <p className="text-sm text-gray-700">
                            {booking.reason}
                          </p>
                        </div>
                      )}

                      {booking.bookedFor && booking.bookedFor.type !== "self" && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                            Booked For
                          </p>
                          <p className="text-sm text-gray-700">
                            {booking.bookedFor.type === "public" ? "Public (Anyone can claim)" : 
                             booking.bookedFor.type === "others" ? "Specific recipients" : 
                             booking.bookedFor.type}
                          </p>
                        </div>
                      )}

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between">
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}
                        >
                          {statusDisplay.icon}
                          {statusDisplay.text}
                        </div>
                        <div className="text-xs text-gray-500">
                          Created {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[160px]"
                          sideOffset={5}
                        >
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => navigate(`/bookings/${booking._id || booking.bookingId}`)}
                          >
                            <User className="h-4 w-4" />
                            View Details
                          </DropdownMenu.Item>
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => openUpdateModal(booking)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit Booking
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                          <DropdownMenu.Item
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-red-100 text-red-600 cursor-pointer"
                            onClick={() => openDeleteDialog(booking._id || booking.bookingId)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Update Booking Modal */}
      <Dialog.Root open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg z-50">
            <Dialog.Title className="text-xl font-semibold mb-4">
              Update Booking
            </Dialog.Title>

            <form
              onSubmit={handleSubmit(handleUpdateBooking)}
              className="space-y-4"
            >
              <FormField
                name="reason"
                label="Reason (Optional)"
                register={register}
                errors={errors}
                placeholder="E.g., Birthday gift, for a friend"
              />

              <FormField
                name="validityDate"
                label="Valid Until"
                type="date"
                register={register}
                errors={errors}
                rules={{ required: "Validity date is required" }}
                min={new Date().toISOString().split("T")[0]}
              />

              <FormField
                name="numberOfBookings"
                label="Number of Bookings"
                type="number"
                register={register}
                errors={errors}
                rules={{
                  required: "Number of bookings is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
                min="1"
              />

              <div className="flex justify-end gap-3 mt-6">
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  disabled={updateBookingMutation.isPending}
                >
                  {updateBookingMutation.isPending
                    ? "Updating..."
                    : "Update Booking"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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

export default BookingsList;
