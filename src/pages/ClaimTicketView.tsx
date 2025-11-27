/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
// import refuel from "@/assets/images/refuel.png";
import { Copy, ChevronLeft, Loader2 } from "lucide-react";
// import chicken from "@/assets/images/chiken.png"
import { useBookingDetailQuery, useClaimBooking } from "@/hooks/useUserQueries";
// import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
import { useToast } from "@/hooks/useToast";
// import { useAuth } from "@/features/auth/hooks";
import { MealDetailsSkeleton } from "@/components/SkeletonLoader";
import type { BookingDetail } from "@/types/ticket";
// import {canClaimBooking} from "@/utils/claim"
// import { renderBadges, hasBadges,getBorderColor} from "@/utils/badgeUtil";
import Brand from "@/assets/svg/LogoText.svg";
const ClaimTicketView = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams<{ ticketId: string }>();
  const { toast } = useToast();
  // const { user } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimedTicketData, setClaimedTicketData] =
    useState<BookingDetail | null>(null);

  const {
    data: ticketData,
    isLoading: isTicketLoading,
    error: ticketError,
  } = useBookingDetailQuery(ticketId || "", {
    enabled: !!ticketId,
  });
  // console.log(ticketData)

  // Claim booking mutation
  const claimBookingMutation = useClaimBooking();

  const booking = Array.isArray(ticketData) ? ticketData[0] : ticketData;
  // Fetch restaurant details - handle both embedded and separate restaurant data
  // No longer needed since restaurant data is now included in booking response
  const restaurant = booking?.bookedAtRestaurant || null; // Ticket interactions (only for claimed tickets)

  const handleClaimTicket = async () => {
    // Use the ticket ID from URL params or booking ID from data
    const idToUse = ticketId || booking?.bookingId || booking?._id;
    setIsClaiming(true);

    if (!idToUse) {
      toast({
        title: "Error",
        description: "No booking ID found for this ticket.",
        variant: "error",
      });
      return;
    }
    if (booking?.status === "claimed") {
      toast({
        title: "Already Claimed",
        description: "This ticket has already been claimed.",
        variant: "info",
      });
      return;
    }


    try {
      const claimResult = await claimBookingMutation.mutateAsync(idToUse);

      if (claimResult?.success) {
        setClaimedTicketData({
          ...booking,
          ...claimResult.data,
          status: "claimed" as const,
        });

        toast({
          title: "Ticket Claimed!",
          description:
            claimResult?.message ||
            "Your meal ticket has been successfully claimed.",
          variant: "success",
        });

      
      } else {
        toast({
          title: "Failed to Claim Ticket",
          description:
            claimResult?.message || "Unable to claim the ticket at this time.",
          variant: "error",
        });
      }
    } catch (error: any) {
      console.error("❌ Claim error details:", error);

      toast({
        title: "Claim Failed",
        description:
          error?.response?.data?.message || "Failed to claim ticket.",
        variant: "error",
      });
    } finally {
      setIsClaiming(false);
    }
  };

  // Handle copy payment reference (since there's no serial number)
  const handleCopyPaymentReference = async () => {
    if (!booking?.paymentReference) return;

    try {
      await navigator.clipboard.writeText(booking.paymentReference);
      toast({
        title: "Copied!",
        description: "Payment reference copied to clipboard.",
        variant: "success",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Copy Failed",
        description: "Could not copy payment reference.",
        variant: "error",
      });
    }
  };
  // console.log("restaurant location=>", restaurant?.location);

  if (isTicketLoading) {
    return <MealDetailsSkeleton />;
  }
  // Error state
  if (ticketError || !booking) {
    return (
      <div className="flex flex-col mt-6">
        <div className="flex mx-4 items-center my-4">
          <Button
            className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <p className="text-center text-2xl justify-center w-full p-2">
            Claim Ticket
          </p>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-red-600 mb-4">
            {ticketError instanceof Error
              ? ticketError.message
              : "Failed to load ticket details"}
          </p>
          <Button
            className="bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col mt-6">
      <div className="flex mx-4 items-center my-4">
        <Button
          className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <p className="text-center text-2xl justify-center w-full p-2">
          Claim Ticket
        </p>
      </div>{" "}
      <div className="mx-4">
        <div className="border rounded-lg flex flex-col justify-center">
          <div className=" w-full relative overflow-hidden rounded-t-lg bg-gray-100">
            <img
              src={booking?.customImage || Brand}
              alt="meal package"
              className="w-full md:w-fit h-full object-contain "
              onError={(e) => {
                e.currentTarget.src = Brand;
              }}
            />
          </div>
          <div className="flex justify-center items-center p-4">
            {claimedTicketData ? (
              <QRCodeDisplay
                qrCodeDataURL={
                  claimedTicketData?.qrCode?.qrCodeDataURL ||
                  booking.qrCode?.qrCodeDataURL ||
                  null
                }
                isGenerating={false}
                ticketId={claimedTicketData?.ticketId || booking._id}
                size="lg"
                className="flex justify-center"
              />
            ) : (
              <div className="relative flex flex-col items-center justify-center w-full">
                <div className="relative w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-70 rounded-lg"></div>
                  <div className="grid grid-cols-3 gap-1 w-36 h-36">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-gray-300 rounded-sm animate-pulse"
                        style={{
                          animationDelay: `${i * 0.05}s`,
                          animationDuration: "1.5s",
                        }}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        QR Code Locked
                      </p>
                      <p className="text-xs text-gray-500">
                        Claim ticket to reveal
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Show claim button only if booking is not already claimed */}
      {booking.status !== "claimed" && (
        <div className="flex justify-center text-center flex-col m-4 p-2 gap-4">
          <Button
            className="border rounded-xl bg-primary text-white p-2 disabled:opacity-50 text-center"
            onClick={handleClaimTicket}
            disabled={isClaiming}
          >
            {isClaiming ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Claiming...
              </span>
            ) : booking.status === "claimed" ? (
              <span
                className="cursor-pointer"
                onClick={() =>
                  navigate(`/tickets/ticketDetails/${booking.bookingId}`, {
                    state: { ticketData: booking },
                  })
                }
              >
                View Ticket
              </span>
            ) : (
              <span className="cursor-pointer">Claim Ticket</span>
            )}
          </Button>
        </div>
      )}
      {/* Payment Reference - Show only if booking is claimed */}
      {booking.status === "claimed" && booking.paymentReference && (
        <div className="m-4 flex flex-col">
          <p className="text-lg">Payment Reference</p>
          <Button
            className="bg-primary/10 text-primary text-center p-2 w-full rounded-xl my-2 inline-flex gap-2 justify-center items-center"
            onClick={handleCopyPaymentReference}
          >
            <Copy className="w-5 h-5" />
            <span className="uppercase">{booking.paymentReference}</span>
          </Button>
        </div>
      )}{" "}
      {/* Restaurant Information */}
      <div className="m-4">
        <h2 className="text-xl font-medium my-2">Restaurant Information</h2>
        <div className="flex gap-2 shadow-sm bg-black/15 rounded-xl min-h-[96px]">
          <div className="h-[8rem] w-auto">
            <img
              src={restaurant?.profileImage || Brand}
              alt="restaurant"
              className="w-full h-full object-cover rounded-l-xl flex-shrink-0"
              style={{ height: "100%" }}
              onError={(e) => {
                e.currentTarget.src = Brand;
              }}
            />
          </div>
          <div className="flex flex-col p-2 flex-1 gap-1">
            <h2 className="text-xl font-medium">
              {restaurant?.name || "Restaurant"}
            </h2>
            <p className="text-sm text-gray-600">{restaurant?.address}</p>
            <p className="text-sm text-gray-600">
              {restaurant?.city}, {restaurant?.state}
            </p>
            {restaurant?.phone && (
              <p className="text-sm text-gray-600">{restaurant.phone}</p>
            )}
          </div>
        </div>
        <Button
          className="bg-primary/10 text-primary text-center p-2 w-full rounded-xl my-4 inline-flex gap-2 justify-center items-center"
          onClick={() =>
            navigate("/map", {
              state: {
                restaurantLocation: restaurant?.location?.coordinates
                  ? {
                      lat: restaurant.location.coordinates[1] ?? 0,
                      lng: restaurant.location.coordinates[0] ?? 0,
                    }
                  : null,
                restaurantName: restaurant?.name || "Restaurant",
                restaurantAddress:
                  restaurant?.address || "Address not available",
              },
            })
          }
        >
          <span>Get Directions</span>
        </Button>
      </div>{" "}
      {/* Menu Items Details */}
      <div className="m-4">
        <h2 className="text-lg font-medium">Menu Items</h2>
        {booking.menuItems &&
          booking.menuItems.length > 0 &&
          (() => {
            // Support both old and new API structure
            const firstItem = booking.menuItems[0];
            const menuItem = firstItem.menu || firstItem;
            const name = menuItem.name || firstItem.name || "Menu Item";
            const price = menuItem.price || firstItem.price || 0;
            const currency =
              menuItem.currency ||
              firstItem.currency ||
              booking.currency ||
              "NGN";
            const images = menuItem.images || firstItem.images || [];
            const imageCount = images.length;
            const imageSrc = images[0] || booking.image || Brand;

            return (
                <div className="flex gap-2 shadow-sm bg-black/15 rounded-xl mb-2 min-h-[96px]">
                <div className="h-[8rem] w-auto relative">
                  <img
                  src={imageSrc}
                  alt="menu item"
                  className="md:w-[10rem] !h-full object-cover rounded-l-xl flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = Brand;
                  }}
                  />
                  {imageCount > 1 && (
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    +{imageCount - 1} more
                  </span>
                  )}
                </div>
                <div className="flex flex-col p-2 flex-1 gap-1 justify-center">
                  <div className="flex items-center justify-between">
                  <h2 className="text-xl font-medium">{name}</h2>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded font-semibold">
                    x{firstItem.quantity || 1}
                  </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                  <span className="text-black font-medium">
                    Price:
                  </span>
                  <span className="text-gray-600 font-semibold">
                    {currency} {price.toLocaleString()}
                  </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                  <span className="text-black font-medium">
                    Total:
                  </span>
                  <span className="text-gray-600 font-semibold">
                    {currency} {(price * (firstItem.quantity || 1)).toLocaleString()}
                  </span>
                  </div>
                </div>
                </div>
            );
          })()}
        <div className="border border-gray-400 my-2" />
        <div className="text-center text-sm">
          {/* {booking.menuItems && booking.menuItems.length > 1 && (
            <span className="block mb-2">
              Items:{" "}
              {booking.menuItems
                .map((item: any) => {
                  const menuItem = item.menu || item;
                  return menuItem.name || item.name || "Menu Item";
                })
                .join(", ")}
            </span>
          )} */}
          {booking.reason && (
            <span className="block mb-2">Reason: {booking.reason}</span>
          )}
          {booking.bookedByUser && (
            <span className="block mb-2">
              Booked by: {booking.bookedByUser.fullName}
            </span>
          )}
          {/* {booking.bookingType && (
            <span className="block mb-2">
              Booking Type:{" "}
              {booking.bookingType.charAt(0).toUpperCase() +
                booking.bookingType.slice(1)}
            </span>
          )} */}
          {/* {booking.totalAmount && (
            <span className="block mb-2">
              Total: {booking.currency} {booking.totalAmount.toLocaleString()}
            </span>
          )} */}
        </div>
        {/* Status information */}
        <p className="text-center text-sm">
          Kindly note that this meal ticket is valid until{" "}
          {booking.validityDate?.stop
            ? new Date(booking.validityDate.stop).toLocaleDateString()
            : new Date(booking.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default ClaimTicketView;
