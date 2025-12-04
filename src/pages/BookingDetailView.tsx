/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  Clock,
  User,
  Users,
  Gift,
  Globe,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  CreditCard,
  Phone,
  // MessageCircle,
  Heart,
  ChevronDown,
  ChevronUp,
  Share2,
  Mail,
} from "lucide-react";
import { BookingDetailViewSkeleton } from "@/components/SkeletonLoader";
import IdDisplay from "@/components/IdDisplay";
import {
  useBookingDetailQuery,
  useDeleteBooking,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/features/auth/hooks";
import { useRestaurantMenuInfoQuery } from "@/hooks/useRestaurantQueries";
import { useTicketEngagementsQuery } from "@/hooks/useTicketServices";
import { useShareBookingAsPost } from "@/hooks/usePosts";
import * as Dialog from "@radix-ui/react-dialog";
import { canClaimBooking } from "@/utils/claim";
import { formatCurrency } from "@/utils/formatCurrency";
import PostForm from "@/components/PostForm";
import type { PostFormData } from "@/components/PostForm";
import { Avatar } from "@radix-ui/themes";
const BookingDetailView: React.FC = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showEngagementDetails, setShowEngagementDetails] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareFormData, setShareFormData] = useState<PostFormData>({
    title: "",
    subtitle: "",
    message: "",
    tags: [] as string[]
  });


  // Query hook for booking details
  const {
    data: bookingData,
    isLoading,
    error,
    isError,
  } = useBookingDetailQuery(bookingId || "", {
    enabled: !!bookingId,
  });
  // console.log("Booking Data:", bookingData);

  // Mutation hooks
  const deleteBookingMutation = useDeleteBooking(bookingId || "");
  const shareBookingMutation = useShareBookingAsPost();

  // Handle the new API response format where data is an array
  const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
  console.log(booking);

  const restaurantFromBooking = booking?.bookedAtBusiness;
  console.log(restaurantFromBooking);
  

  // Prefer embedded restaurant data over separate query result
  const restaurant = restaurantFromBooking;
  // Use restaurant payment currency if available
  const paymentCurrency =
    restaurant?.paymentCurrency || booking?.paymentCurrency || "NGN";
  const isBookingCreator =
    user &&
    booking &&
    (booking.bookedById === user.id ||
      booking.bookedByUser?._id === user.id ||
      booking.bookedByUser?.id === user.id);

  // Query ticket engagements for this booking (only if user is the booking creator)
  const { data: engagementData, isLoading: isEngagementLoading } =
    useTicketEngagementsQuery(
      booking?.bookingId || bookingId || "",
      !!(booking?.bookingId || bookingId) && isBookingCreator
    );
    

  // Check if booking can be edited (only pending bookings by the creator)
  const canEditBooking =
    isBookingCreator && booking?.status?.toLowerCase() === "pending";

  // Helper functions
  const getBookingTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "self":
        return <User className="w-5 h-5" />;
      case "others":
        return <Users className="w-5 h-5" />;
      case "public":
        return <Globe className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };
  const getStatusDisplay = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "confirmed":
        return {
          color: "text-green-600 bg-green-50",
          icon: <CheckCircle className="w-4 h-4" />,
          text: "Confirmed",
        };
      case "paid":
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
  const mealIds =
    booking?.items?.map((item: any) => item.product?._id) ||
    [];
  // 2. Fetch all meals in one query (assuming your API supports batch fetching)
  const { data: allMeals } = useRestaurantMenuInfoQuery(
    booking?.restaurantId || booking?.bookedAtBusiness?.businessId || "",
    mealIds
  );

  console.log(allMeals);
  
  // Handle claim booking

  const canClaim = canClaimBooking(user, booking);

  // Handle delete booking
  const handleDeleteBooking = async () => {
    try {
      await deleteBookingMutation.mutateAsync();

      toast({
        title: "Booking deleted successfully!",
        description: "Your booking has been removed.",
        variant: "success",
      });

      setIsDeleteDialogOpen(false);
      navigate(-1); // Go back to previous page
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  // Handle opening share dialog
  const handleShareBooking = () => {
    if (!booking) return;

    // Pre-populate form with default values
    setShareFormData({
      title: `Shared my BoookBox experience at ${restaurant?.name || "a restaurant"}!`,
      subtitle: `${booking.menuItems?.length || 0} meals booked • Spreading joy through food`,
      message: `Just booked ${booking.menuItems?.length || 0} delicious meals through BoookBox. Join me in spreading joy through food! 🍽️❤️`,
      tags: ["BoookBox", "FoodSharing", "Community"]
    });
    setIsShareDialogOpen(true);
  };

  // Handle sharing the post after form submission
  const handleSubmitSharePost = async () => {
    if (!booking) return;

    try {
      await shareBookingMutation.mutateAsync({
        bookingId: booking.bookingId,
        title: shareFormData.title,
        subtitle: shareFormData.subtitle,
        message: shareFormData.message,
        tags: shareFormData.tags,
        visibility: "public"
      });

      toast({
        title: "Post shared successfully!",
        description: "Your booking has been shared to the community feed.",
        variant: "success",
      });
      
      setIsShareDialogOpen(false);
    } catch (error) {
      toast({
        title: "Share failed",
        description:
          error instanceof Error ? error.message : "Unable to share post.",
        variant: "error",
      });
    }
  };



  // Handle edit booking - navigate to restaurant page
  const handleEditBooking = () => {
    // Navigate to restaurant page with booking ID for editing
    const restaurantId = booking?.restaurantId || "";

    const bookingIdForEdit = booking?.bookingId;

    if (restaurantId && bookingIdForEdit) {
      navigate(
        `/restaurants/${restaurantId}/orders?editBooking=${bookingIdForEdit}`
      );
    } else {
      toast({
        title: "Unable to edit",
        description: "Restaurant or booking information is missing.",
        variant: "error",
      });
    }
  }; // Handle claim booking
  const handleClaimBooking = () => {
    const bookingIdForClaim = booking?.bookingId;

    if (bookingIdForClaim) {
      navigate(`/tickets/claim/${bookingIdForClaim}`);
    } else {
      toast({
        title: "Unable to claim",
        description: "Booking information is missing.",
        variant: "error",
      });
    }
  };

  // Handle pay now - navigate to checkout with booking ID
  const handlePayNow = () => {
    const bookingIdForPayment = booking?.bookingId;
    if (bookingIdForPayment) {
      navigate(`/checkout?bookingId=${bookingIdForPayment}`);
    } else {
      toast({
        title: "Unable to proceed",
        description: "Booking information is missing.",
        variant: "error",
      });
    }
  };

  if (isLoading) {
    return <BookingDetailViewSkeleton />;
  }
  if (isError || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 ">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Booking not found
            </h3>
            <p className="text-gray-600 mb-6">
              {error instanceof Error
                ? error.message
                : "The booking you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <button
              className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusDisplay = getStatusDisplay(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 ">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="rounded-xl p-2 bg-[#ECE6F0] mr-4 md:mr-0 md:mb-4"
                onClick={() => navigate(-1)}
              >
                <ChevronLeft className="h-6 w-6 text-black" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Booking Details
                </h1>{" "}
                <IdDisplay
                  id={booking.bookingId}
                  label="Booking ID"
                  maxLength={10}
                  className="text-sm text-gray-600"
                />
              </div>{" "}
            </div>
            <div className="flex items-center gap-2">
              {" "}
              {canEditBooking && (
                <button
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                  onClick={handleEditBooking}
                  title="Edit booking"
                >
                  <Edit3 className="h-5 w-5" />
                </button>
              )}
              {canEditBooking && (
                <button
                  className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  title="Delete booking"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {" "}
            {/* Restaurant Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {restaurant?.profileImage ? (
                    <img
                      src={restaurant.profileImage}
                      alt={restaurant.name || "Restaurant"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xl">
                      {restaurant?.name?.charAt(0) || "R"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  {" "}
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">
                    {isLoading
                      ? "Loading..."
                      : restaurant?.name || "Restaurant"}
                  </h2>
                  {restaurant?.address && (
                    <p className="text-gray-600 flex items-center gap-1 mb-2">
                      <MapPin className="h-4 w-4" />
                      {restaurant.address}
                    </p>
                  )}
                  {restaurant?.phone && (
                    <p className="text-gray-600 flex items-center gap-1 mb-2">
                      <Phone className="h-4 w-4" />
                      {restaurant.phone}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.color}`}
                    >
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {getBookingTypeIcon(booking.bookingType)}
                      <span className="capitalize">
                        {booking.bookingType || "self"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>{" "}

            {/* Meal Package Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Package Details
              </h3>
              <div className="flex gap-4 mb-4 relative">
                {/* Image Container - Fixed Size with Aspect Ratio */}
                <div className="flex-shrink-0 relative rounded-lg bg-gray-100 w-full">
                  <img
                    src={
                      allMeals?.[0]?.images || // First meal image if available
                      booking.image || // Booking-level image
                      "" // Ultimate fallback
                    }
                    alt={
                      allMeals?.[0]?.name || booking.reason || "Meal package"
                    }
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.onerror = null; // Prevent infinite loop
                    }}
                    loading="lazy"
                  />

                  {/* Image Count Badge if Multiple Images */}
                  {allMeals?.[0]?.images?.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                      +{Math.max(allMeals?.[0]?.images?.length || 0) - 1}
                    </div>
                  )}
                </div>
              </div>{" "}
              {/* Menu Items */}
              {booking.items && booking.items.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Menu Items</h4>{" "}
                  <div className="space-y-2">
                    {booking.items.map((item: any, index: number) => {
                      // Handle both old and new API structure
                      const menuItem = item.product || item;
                      const quantity = item.quantity || 1;
                      const price = menuItem.price || item.price || 0;
                      const name = menuItem.name || item.name || "Menu Item";

                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <div>
                            <span className="text-sm font-medium">{name}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              x{quantity}
                            </span>
                          </div>
                          <span className="text-sm font-medium">
                            {formatCurrency(price * quantity, paymentCurrency)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-medium">
                        <span>Total Amount</span>
                        <span>
                          {formatCurrency(booking.totalAmount, paymentCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>{" "}
            {/* Additional Details */}
            {(booking.reason ||
              booking.bookedFor ||
              booking.redemptionMode ||
              booking.tags) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {booking.reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Reason
                      </p>
                      <p className="text-gray-600">{booking.reason}</p>
                    </div>
                  )}
                  {booking.bookedFor && booking.bookedFor.type !== "self" && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Booked For
                      </p>
                      <p className="text-gray-600 capitalize">
                        {booking.bookedFor.type}
                      </p>
                      {booking.bookedFor.contact &&
                        booking.bookedFor.contact.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {booking.bookedFor.contact.map(
                              (contact: any, index: number) => {
                                // Only the booker can see full contact info
                                if (isBookingCreator) {
                                  return (
                                    <div
                                      key={index}
                                      className="text-sm text-gray-600"
                                    >
                                      <p>
                                        {contact.name} - {contact.email}
                                      </p>
                                      {contact.phoneNumber && (
                                        <p>{contact.phoneNumber}</p>
                                      )}
                                      {contact.address && (
                                        <p>{contact.address}</p>
                                      )}
                                    </div>
                                  );
                                }
                                // Others see only name and number of recipients
                                return (
                                  <div
                                    key={index}
                                    className="text-sm text-gray-600"
                                  >
                                    <p>
                                      {contact.email === user?.email
                                        ? contact.name
                                        : ""}
                                      {booking.bookedFor.contact.length > 1
                                        ? ` +${
                                            booking.bookedFor.contact.length - 1
                                          } recipient(s)`
                                        : ""}
                                    </p>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        )}
                    </div>
                  )}
                  {(booking.bookedByName || booking.bookedByUser?.fullName) && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Booked By
                      </p>
                      <div className="text-gray-600">
                        <p>
                          {booking.bookedByName ||
                            booking.bookedByUser?.fullName}
                        </p>
                        {booking.bookedByUser?.email && (
                          <p className="text-sm text-gray-500">
                            {booking.bookedByUser.email}
                          </p>
                        )}
                        {booking.bookedByUser?.phoneNumber && (
                          <p className="text-sm text-gray-500">
                            {booking.bookedByUser.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {booking.redemptionMode && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Redemption Mode
                      </p>
                      <p className="text-gray-600 capitalize">
                        {booking.redemptionMode}
                      </p>
                    </div>
                  )}
                  {booking.includeUtensils !== undefined && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Include Utensils
                      </p>
                      <p className="text-gray-600">
                        {booking.includeUtensils ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                  {booking.tags && booking.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Tags</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {booking.tags.map((tag: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Booking Summary
              </h3>
              <div className="space-y-4">
                {" "}
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity</span>
                  <span className="font-medium text-sm">
                    {booking.numberOfBookings || 1} meal(s)
                  </span>
                </div>
                {booking.slotsTaken !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slots Taken</span>
                    <span className="font-medium text-sm">
                      {booking.slotsTaken} / {booking.numberOfBookings || 1}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-medium text-sm ${
                      statusDisplay.color.split(" ")[0]
                    }`}
                  >
                    {statusDisplay.text}
                  </span>
                </div>{" "}
                {booking.validityDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validity Period</span>
                    <span className="font-medium text-sm">
                      {(() => {
                        if (typeof booking.validityDate === "string") {
                          const date = new Date(booking.validityDate);
                          return isNaN(date.getTime())
                            ? "N/A"
                            : date.toLocaleDateString();
                        } else if (
                          booking.validityDate.start &&
                          booking.validityDate.stop
                        ) {
                          const startDate = new Date(
                            booking.validityDate.start
                          );
                          const stopDate = new Date(booking.validityDate.stop);
                          if (
                            isNaN(startDate.getTime()) ||
                            isNaN(stopDate.getTime())
                          ) {
                            return "N/A";
                          }
                          return `${startDate.toLocaleDateString()} - ${stopDate.toLocaleDateString()}`;
                        } else {
                          const date = new Date(
                            booking.validityDate.stop ||
                              booking.validityDate.start
                          );
                          return isNaN(date.getTime())
                            ? "N/A"
                            : date.toLocaleDateString();
                        }
                      })()}
                    </span>
                  </div>
                )}
                {booking.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium text-sm">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {booking.bookedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Booked At</span>
                    <span className="font-medium text-sm">
                      {new Date(booking.bookedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}{" "}
              </div>{" "}
            </div>

            {/* Social Media Style Engagement - Only show for booking creators */}
            {isBookingCreator && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Ticket Engagement
                  </h3>
                  <button
                    onClick={() =>
                      setShowEngagementDetails(!showEngagementDetails)
                    }
                    className="text-primary hover:text-primary/80"
                  >
                    {showEngagementDetails ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {isEngagementLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : engagementData?.data && engagementData.data.length > 0 ? (
                  <>
                    {/* Social Media Style Summary - Top Display */}
                    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gradient-to-r from-blue-50 to-purple-50">
                      {/* Reaction Summary */}
                      {engagementData.reactionSummary &&
                        Object.keys(engagementData.reactionSummary).length > 0 && (
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-1">
                                {Object.entries(engagementData.reactionSummary)
                                  .filter(([, count]) => (count as number) > 0)
                                  .slice(0, 5)
                                  .map(([type], index) => (
                                    <div
                                      key={type}
                                      className="flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-white shadow-sm"
                                      style={{ zIndex: 5 - index }}
                                    >
                                      <span className="text-sm">
                                        {type === "like" && "👍"}
                                        {type === "love" && "❤️"}
                                        {type === "laugh" && "😄"}
                                        {type === "wow" && "😮"}
                                        {type === "sad" && "😢"}
                                        {type === "angry" && "😠"}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">
                                  {Object.values(engagementData.reactionSummary).reduce(
                                    (total: number, count: unknown) => total + (count as number),
                                    0
                                  )}
                                </span>{" "}
                                <Heart className="w-4 h-4 inline text-red-500" />
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">
                                {
                                   
                                  engagementData.data.filter((item: any) => item.message)
                                    .length || engagementData.data.length || 0
                                }
                              </span>{" "}
                              <Mail className="w-4 h-4 inline" /> 
                            </div>
                          </div>
                        )}

                      {/* Claimed By User Info */}
                      {engagementData.data[0]?.claimedByUser && (
                        <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-green-200 flex-col">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                            {engagementData.data[0].claimedByUser.profileImage ? (
                              <Avatar
                                src={engagementData.data[0].claimedByUser.profileImage}
                                fallback={
                                  engagementData.data[0].claimedByUser.fullName || "User"
                                }
                                radius="full"
                                size="4"
                              />
                            ) : (
                              <span className="text-green-600 font-medium text-sm">
                                {engagementData.data[0].claimedByUser.fullName?.charAt(0) ||
                                  "U"}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 ellipsis truncate max-w-[150px]">
                              Claimed by{" "}
                              {engagementData.data[0].claimedByUser.fullName ||
                                "Unknown User"}
                            </p>
                            {engagementData.data[0].claimedByUser.email && (
                              <p className="text-xs text-gray-500">
                                {engagementData.data[0].claimedByUser.email}
                              </p>
                            )}
                          </div>
                          <div className="text-xs text-green-600 font-medium">CLAIMED</div>
                        </div>
                      )}
                    </div>

                    {/* Scrollable Social Media Chat Feed */}
                    {showEngagementDetails && (
                      <div className="border rounded-lg bg-white max-h-[400px] min-h-[250px] overflow-y-auto flex flex-col p-4 space-y-4">
                        {engagementData.data.map((engagement: any, index: number) => {
                          // Determine if the message is from the booking creator or someone else
                          const isCreator =
                            engagement.claimedByUser?.id === user?.id ||
                            engagement.claimedByUser?._id === user?.id;
                          return (
                            <div
                              key={engagement.ticketId || engagement._id || index}
                              className={`flex ${isCreator ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`flex items-end gap-2 max-w-[80%] ${
                                  isCreator
                                    ? "flex-row-reverse text-right"
                                    : "flex-row text-left"
                                }`}
                              >
                                {/* Avatar */}
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {engagement.claimedByUser?.profileImage && (
                                    <Avatar
                                      src={engagement.claimedByUser.profileImage}
                                      fallback={
                                        engagement.claimedByUser.fullName ||
                                        engagement.claimedByName ||
                                        "User"
                                      }
                                      size="4"
                                    />
                                  
                                  )}
                                </div>
                                {/* Message Bubble */}
                                <div
                                  className={`rounded-xl px-4 py-3 shadow-sm border ${
                                    isCreator
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "bg-gray-50 border-gray-200 text-gray-700"
                                  }`}
                                >
                                  <div className=" items-start gap-2 mb-1 inline-flex w-full  justify-between flex-col">
                                    <span className="text-xs font-semibold w-full ellipsis truncate max-w-[120px]">
                                      {engagement.claimedByUser?.fullName ||
                                        engagement.claimedByName ||
                                        "Anonymous"}
                                    </span>
                                   
                                  </div>
                                  {/* Reaction */}
                                  {engagement.reaction && (
                                    <div className="mb-1">
                                      <span className="text-lg">
                                        {engagement.reaction === "like" && "👍"}
                                        {engagement.reaction === "love" && "❤️"}
                                        {engagement.reaction === "laugh" && "😄"}
                                        {engagement.reaction === "wow" && "😮"}
                                        {engagement.reaction === "sad" && "😢"}
                                        {engagement.reaction === "angry" && "😠"}
                                      </span>
                                    </div>
                                  )}
                                  {/* Message/Comment */}
                                  {engagement.message && (
                                    <p className="text-sm">{engagement.message}</p>
                                  )}
                                  {/* Empty State for Individual Ticket */}
                                  {!engagement.reaction && !engagement.message && (
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                      <Heart className="w-4 h-4" />
                                      No activity on this ticket yet
                                    </div>
                                  )}
                                   <span className="text-xs text-gray-400">
                                      {engagement.claimedAt
                                        ? new Date(engagement.claimedAt).toLocaleTimeString(
                                            [],
                                            { hour: "2-digit", minute: "2-digit" }
                                          )
                                        : ""}
                                    </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {/* If no activities */}
                        {engagementData.data.length === 0 && (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Heart className="w-6 h-6 mr-2" />
                            No activity yet
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">
                      No Engagement Yet
                    </h4>
                    <p className="text-gray-500 text-sm">
                      When people interact with your tickets, you'll see their
                      reactions and comments here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {(() => {
              const isPending = booking.status?.toLowerCase() === "pending";
              const showPayNowButton = isPending;
              const showEditButton = canEditBooking;
              const showDeleteButton = canEditBooking;
              const showClaimButton = canClaim;
              const showShareButton = isBookingCreator && (booking.status?.toLowerCase() === "paid" || booking.status?.toLowerCase() === "used");

              const showActions =
                showPayNowButton ||
                showEditButton ||
                showDeleteButton ||
                showClaimButton ||
                showShareButton;

              if (!showActions) {
                return null;
              }

              return (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Actions
                  </h3>
                  <div className="space-y-3">
                    {showPayNowButton && (
                      <button
                        className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
                        onClick={handlePayNow}
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </button>
                    )}
                    {showClaimButton && (
                      <button
                        className="w-full bg-green-100 text-green-600 py-3 rounded-lg hover:bg-green-200 flex items-center justify-center gap-2"
                        onClick={handleClaimBooking}
                      >
                        <Gift className="h-4 w-4" /> Claim Booking
                      </button>
                    )}
                    {showShareButton && (
                      <button
                        className="w-full bg-purple-100 text-purple-600 py-3 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2"
                        onClick={handleShareBooking}
                      >
                        <Share2 className="h-4 w-4" />
                        Share as Post
                      </button>
                    )}
                    {showEditButton && (
                      <button
                        className="w-full bg-blue-100 text-blue-600 py-3 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
                        onClick={handleEditBooking}
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit Booking
                      </button>
                    )}
                    {showDeleteButton && (
                      <button
                        className="w-full bg-red-100 text-red-600 py-3 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Share Booking Dialog */}
      <Dialog.Root open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 w-[90vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg z-50 max-h-[85vh] overflow-hidden">
            <PostForm
              data={shareFormData}
              onDataChange={setShareFormData}
              onSubmit={handleSubmitSharePost}
              onCancel={() => setIsShareDialogOpen(false)}
              isSubmitting={shareBookingMutation.isPending}
              submitLabel="Share Experience"
              title="Share Your BoookBox Experience"
              description="Tell the community about your meal booking and spread the joy of sharing food!"
              suggestedTags={[
                "BoookBox", "FoodSharing", "Community", "Meals", 
                restaurant?.name || "Restaurant", booking?.bookingType || "Booking",
                "Giving", "Kindness", "FoodForAll", "Support", "Local", "Charity",
                "GenerousEating", "ShareJoy", "FoodLove"
              ]}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
      
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <Dialog.Portal>
          <Dialog.Overlay  className="fixed inset-0 bg-black/50 z-40" />
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
                <button
                  type="button"
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteBooking}
                disabled={deleteBookingMutation.isPending}
              >
                {deleteBookingMutation.isPending
                  ? "Deleting..."
                  : "Delete Booking"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

export default BookingDetailView;
