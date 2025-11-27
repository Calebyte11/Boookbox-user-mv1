/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * BookingDashboard Component - Example usage of all booking React Query hooks
 *
 * This component demonstrates how to use:
 * - useAllBookingsQuery (for fetching all bookings)
 * - useUpdateBooking (for updating existing bookings)
 * - useDeleteBooking (for deleting bookings)
 * - useSelfBookingsQuery, useOthersBookingsQuery, useGiftedBookingsQuery, usePublicBookingsQuery
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAllBookingsQuery,
  useUpdateBooking,
  useDeleteBooking,
  useSelfBookingsQuery,
  useOthersBookingsQuery,
  useGiftedBookingsQuery,
  usePublicBookingsQuery,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import Button from "@/components/Button";
import { Edit, Trash2, Calendar, User, Users, Gift, Globe } from "lucide-react";
import type { BookingUpdateBody } from "@/services/usersService";

interface BookingCardProps {
  booking: any;
  onUpdate: (booking: any) => void;
  onDelete: (bookingId: string) => void;
}

const BookingCard = ({ booking, onUpdate, onDelete }: BookingCardProps) => {
  const getBookingTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "self":
        return <User className="w-4 h-4" />;
      case "others":
        return <Users className="w-4 h-4" />;
      case "public":
        return <Globe className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {booking.restaurant?.image ? (
              <img
                src={booking.restaurant.image}
                alt={booking.restaurant.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-medium">
                {booking.restaurant?.name?.charAt(0) || "R"}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {booking.restaurant?.name || "Restaurant"}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {getBookingTypeIcon(booking.bookingType)}
              <span className="capitalize">
                {booking.bookingType || "personal"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
              booking.status
            )}`}
          >
            {booking.status || "pending"}
          </span>
        </div>
      </div>        <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <span className="text-gray-500">Quantity:</span>
          <span className="ml-1 font-medium">
            {booking.numberOfBookings || 1}
          </span>
        </div>
        <div>
          <span className="text-gray-500">Valid Until:</span>
          <span className="ml-1 font-medium">
            {booking.validityDate
              ? (() => {
                  if (typeof booking.validityDate === 'string') {
                    return new Date(booking.validityDate).toLocaleDateString();
                  } else if (booking.validityDate.stop) {
                    return new Date(booking.validityDate.stop).toLocaleDateString();
                  } else if (booking.validityDate.start) {
                    return new Date(booking.validityDate.start).toLocaleDateString();
                  }
                  return "Not set";
                })()
              : "Not set"}
          </span>
        </div>
      </div>

      {booking.reason && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">Reason:</span>
          <p className="text-sm text-gray-700 mt-1">{booking.reason}</p>
        </div>
      )}

      {booking.bookedFor && booking.bookedFor !== "self" && (
        <div className="mb-3">
          <span className="text-gray-500 text-sm">Booked For:</span>
          <p className="text-sm text-gray-700 mt-1">{booking.bookedFor}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Created {new Date(booking.createdAt).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <Button
            className="p-2 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-lg"
            onClick={() => onUpdate(booking)}
            title="Update booking"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
            onClick={() => onDelete(booking.id)}
            title="Delete booking"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const BookingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "all" | "self" | "others" | "gifts" | "public"
  >("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  // Example: Fetch different types of bookings
  const {
    data: allBookingsData,
    isLoading: isAllLoading,
    error: allError,
    refetch: refetchAll,
  } = useAllBookingsQuery({
    page: 1,
    limit: 20,
    // status: "active", // Optional: filter by status
  });

  const { data: selfBookingsData, isLoading: isSelfLoading } =
    useSelfBookingsQuery({
      page: 1,
      limit: 20,
    });

  const { data: othersBookingsData, isLoading: isOthersLoading } =
    useOthersBookingsQuery({
      page: 1,
      limit: 20,
    });

  const { data: giftedBookingsData, isLoading: isGiftsLoading } =
    useGiftedBookingsQuery({
      page: 1,
      limit: 20,
    });

  const { data: publicBookingsData, isLoading: isPublicLoading } =
    usePublicBookingsQuery({
      page: 1,
      limit: 20,
    });

  // Example: Update booking mutation
  const updateBookingMutation = useUpdateBooking(selectedBooking?.id || "");

  // Example: Delete booking mutation
  const deleteBookingMutation = useDeleteBooking(selectedBooking?.id || "");

  // Get current bookings based on active tab
  const getCurrentBookings = () => {
    switch (activeTab) {
      case "self":
        return { data: selfBookingsData, isLoading: isSelfLoading };
      case "others":
        return { data: othersBookingsData, isLoading: isOthersLoading };
      case "gifts":
        return { data: giftedBookingsData, isLoading: isGiftsLoading };
      case "public":
        return { data: publicBookingsData, isLoading: isPublicLoading };
      default:
        return { data: allBookingsData, isLoading: isAllLoading };
    }
  };

  const { data: currentData, isLoading } = getCurrentBookings();
  const bookings = Array.isArray(currentData?.data) ? currentData.data : [];

  // Example: Handle booking update
  const handleUpdateBooking = async (booking: any) => {
    setSelectedBooking(booking);

    // Example update data - you would typically get this from a form
    const updateData: BookingUpdateBody = {
      reason: "Updated reason for demonstration",
      validityDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // 7 days from now
      numberOfBookings: booking.numberOfBookings + 1, // Increment quantity as example
    };

    try {
      await updateBookingMutation.mutateAsync(updateData);

      toast({
        title: "Booking updated successfully!",
        description: `Updated booking for ${
          booking.restaurant?.name || "restaurant"
        }`,
        variant: "success",
      });

      // Optionally refetch data
      refetchAll();
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setSelectedBooking(null);
    }
  };

  // Example: Handle booking deletion
  const handleDeleteBooking = async (bookingId: string) => {
    setSelectedBooking({ id: bookingId });

    try {
      await deleteBookingMutation.mutateAsync();

      toast({
        title: "Booking deleted successfully!",
        description: "The booking has been removed",
        variant: "success",
      });

      // Optionally refetch data
      refetchAll();
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "error",
      });
    } finally {
      setSelectedBooking(null);
    }
  };

  // Tab configuration
  const tabs = [
    { key: "all", label: "All Bookings", icon: Calendar },
    { key: "self", label: "Personal", icon: User },
    { key: "others", label: "For Others", icon: Users },
    { key: "gifts", label: "Gifts", icon: Gift },
    { key: "public", label: "Public", icon: Globe },
  ];

  // Error handling
  if (allError) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">Failed to load bookings</p>
        <Button
          className="bg-primary text-white px-4 py-2 rounded-lg"
          onClick={() => refetchAll()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Booking Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your meal bookings and gifts
          </p>
        </div>
        <Button
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90"
          onClick={() => navigate("/restaurants")}
        >
          <Calendar className="w-4 h-4 mr-2" />
          New Booking
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.key}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab(tab.key as any)}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      )}

      {/* Bookings Grid */}
      {!isLoading && (
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab !== "all" ? `${activeTab} ` : ""}bookings found
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === "all"
                  ? "You haven't made any bookings yet. Start by booking your first meal!"
                  : `You don't have any ${activeTab} bookings yet.`}
              </p>
              <Button
                className="bg-primary text-white px-6 py-3 rounded-lg"
                onClick={() => navigate("/restaurants")}
              >
                Make Your First Booking
              </Button>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Bookings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          bookings.filter((b: any) => b.status === "active")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Gift className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Meals</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {bookings.reduce(
                          (sum: number, b: any) =>
                            sum + (b.numberOfBookings || 1),
                          0
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Restaurants</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          new Set(
                            bookings
                              .map((b: any) => b.restaurant?.id)
                              .filter(Boolean)
                          ).size
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bookings.map((booking: any) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onUpdate={handleUpdateBooking}
                    onDelete={handleDeleteBooking}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Loading States for Mutations */}
      {(updateBookingMutation.isPending || deleteBookingMutation.isPending) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">
              {updateBookingMutation.isPending
                ? "Updating booking..."
                : "Deleting booking..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDashboard;
