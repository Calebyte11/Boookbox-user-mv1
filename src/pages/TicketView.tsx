/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { format } from "date-fns";
// import Button from "@/components/Button";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import Brand from "@/assets/svg/LogoText.svg";
import TicketRedemptionCalendar from "@/components/TicketRedemptionCalendar";
import { createRestaurantLocalDateTime, generateTimeSlots } from "@/utils/timezoneUtils";

import {
  Copy,
  ChevronLeft,
  MessageCircle,
  Heart,
  Send,
  ChevronDown,
  ChevronUp,
  CalendarIcon,
} from "lucide-react";
import ActivityHero from "@/assets/images/sponsorbanner.png";
// Radix Dialog (theme package provides radix components/styles)
import * as Dialog from "@radix-ui/react-dialog";
// import chicken from "@/assets/images/chiken.png";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useTicketDetailQuery } from "@/hooks/useUserQueries";
import {
  useNotifyRedemption,
  useTicketOperations,
} from "@/hooks/useTicketServices";
import { useTicketQRCode } from "@/hooks/useTicketQRCode";
import { useToast } from "@/hooks/useToast";
import { captureAndViewTicket } from "@/utils/ticketCapture";
// import { useRestaurantDetailQuery } from "@/hooks/useRestaurantQueries";
import type { ApiTicketResponse } from "@/types/ticket";
// API Response type that matches the actual structure

const TicketView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ticketId } = useParams<{ ticketId?: string }>();
  const { toast } = useToast();
  // State for ticket capture
  const [isCapturing, setIsCapturing] = useState(false);

  const [showMessages, setShowMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Local state for interactive reactions
  const [localReaction, setLocalReaction] = useState<string | null>(null);
  const [isReactionAnimating, setIsReactionAnimating] = useState(false);

  // State for redeem ticket calendar and time selection
  const [selectedRedeemDate, setSelectedRedeemDate] = useState<Date>(new Date());
  const [selectedRedeemTime, setSelectedRedeemTime] = useState<string>("12:00");

  // Notify redemption mutation
  const notifyRedemption = useNotifyRedemption();

  // Ticket operations for posting messages and reactions
  const {
    postMessage,
    postReaction,
    isPostingMessage,
    isPostingReaction,
    messageError,
    // reactionError,
  } = useTicketOperations();

  // QR Code management
  const {
    qrCodeDataURL,
    isGenerating: isGeneratingQR,
    error: qrError,
    generateOrRetrieveQRCode,
    clearError: clearQRError,
    // hasQRCode,
  } = useTicketQRCode();

  // Get ticket data from navigation state or fetch from API
  const ticketFromState = location.state?.ticketData as
    | ApiTicketResponse
    | undefined;

  // Fetch ticket details if not available from state and ticketId is provided
  const {
    data: ticketData,
    isLoading: isTicketLoading,
    error: ticketError,
  } = useTicketDetailQuery(ticketId || "", {
    enabled: !!ticketId && !ticketFromState,
  }); // Handle different response structures like in ClaimTicketView
  const ticket: ApiTicketResponse | null = Array.isArray(ticketData?.data)
    ? ticketData.data[0]
    : ticketFromState || ticketData?.data || null; // Fetch restaurant details with proper error handling
  // No longer needed since restaurant data is now included in ticket response
  const restaurant = ticket?.bookedForBusiness || null;
  console.log(ticket);
  

  // Generate QR code when ticket is available
  useEffect(() => {
    if (ticket?.ticketId) {
      // Check if ticket already has QR code from server, otherwise generate one
      if (ticket.qrCode?.qrCodeDataURL) {
        // Ticket already has QR code, but still generate/retrieve for storage
        generateOrRetrieveQRCode(ticketId || "");
      } else {
        // Generate new QR code
        generateOrRetrieveQRCode(ticketId || ticket?.ticketId);
      }
    }
  }, [
    ticket?.ticketId,
    generateOrRetrieveQRCode,
    ticket?.qrCode?.qrCodeDataURL,
    ticketId,
  ]);
  // Get the QR code to display (prioritize server QR code, then generated one)
  const displayQRCode = ticket?.qrCode?.qrCodeDataURL || qrCodeDataURL;

  // Use ticket's embedded message and reaction data
  const currentMessage = ticket?.message || null;
  const currentReaction = localReaction || ticket?.reaction || null;

  // Handle message submission
  const handleSendMessage = () => {
    if (!newMessage.trim() || !ticket?.ticketId) return;
    postMessage(ticket.ticketId, newMessage.trim(), ticket?.bookingId);
    setNewMessage("");
  };

  // Handle reaction submission with animation
  const handleReaction = (reaction: string) => {
    if (!ticket?.ticketId) return;

    setIsReactionAnimating(true);
    setLocalReaction(reaction);

    // Post reaction to server
    postReaction(ticket.ticketId, reaction as any, ticket?.bookingId);

    // Reset animation after a delay
    setTimeout(() => {
      setIsReactionAnimating(false);
    }, 600);
  };
  // Handle copy ticket ID
  const handleCopySerialNumber = async () => {
    if (!ticket?.ticketId) return;

    // Try using navigator.clipboard first
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(ticket.ticketId);
      } else {
        // Fallback for insecure context
        const input = document.createElement("input");
        input.value = ticket.ticketId;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      toast({
        title: "Copied!",
        description: "Ticket ID copied to clipboard.",
        variant: "success",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Copy Failed",
        description: "Could not copy ticket ID.",
        variant: "error",
      });
    }
  };

  // Handle view screen ticket
  const handleViewScreenTicket = async () => {
    if (!ticket?.ticketId) return;
    setIsCapturing(true);

    try {
      // Wait for QR code to be fully generated and displayed
      if (isGeneratingQR) {
        toast({
          title: "Please wait",
          description:
            "QR code is still generating. Please try again in a moment.",
          variant: "default",
        });
        setIsCapturing(false);
        return;
      }

      // Extra wait time for all elements to fully render
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await captureAndViewTicket(
        "ticket-image-container",
        `meal-ticket-${ticket.ticketId}`
      );

      toast({
        title: "Ticket Captured!",
        description: "Ticket image opened in new window.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error capturing ticket:", error);
      toast({
        title: "Capture Failed",
        description: "Failed to capture ticket image. Please try again.",
        variant: "error",
      });
    } finally {
      setIsCapturing(false);
    }
  }; // Loading state - include restaurant loading
  if (isTicketLoading) {
    return (
      <div className="flex flex-col ">
        <div className="flex mx-4 items-center my-4">
          <button
            className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <p className="text-center text-2xl justify-center w-full p-2">
            Ticket Details
          </p>
        </div>
        <div className="flex flex-col gap-4 p-8">
          <div className="flex justify-center items-center">
            <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state or no ticket data
  if (ticketError || !ticket) {
    return (
      <div className="flex flex-col">
        <div className="flex mx-4 items-center my-4">
          <button
            className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <p className="text-center text-2xl justify-center w-full p-2">
            Ticket Details
          </p>
        </div>{" "}
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {" "}
          <p className="text-red-600 mb-4">
            {ticketError instanceof Error
              ? ticketError.message
              : "No ticket data available"}
          </p>
          <button
            className="bg-primary text-white px-4 py-2 rounded-lg"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // handle redeemption ticket
  const handleRedeemTicket = async () => {
    if (!ticket?.ticketId) return;
    
    // Use timezone-aware datetime creation to ensure consistency
    const redeemDateTime = createRestaurantLocalDateTime(selectedRedeemDate, selectedRedeemTime);
    
    await notifyRedemption.mutateAsync({
      ticketId: ticket.ticketId,
      date: redeemDateTime,
    });
    // Toast is handled in the hook
  };
  return (
    <div className="flex flex-col overflow-x-hidden min-h-screen">
      <div className="flex mx-4 items-center my-4">
        <button
          className="p-2 bg-[#ECE6F0] rounded-lg w-[48px] h-[48px]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <p className="text-center md:text-2xl text-xl justify-center w-full p-2">
          Ticket Details
        </p>
      </div>
      <div className="flex justify-center text-center flex-col mx-4 p-2 gap-2">
        <button
          className={`border rounded-xl p-2  ${
            ticket.status === "unused" || ticket.status === "claimed"
              ? "border-emerald-600 text-emerald-600"
              : ticket.status === "expired"
              ? "border-red-500 text-red-500"
              : "border-gray-500 text-gray-500"
          }`}
        >
          <span>
            {ticket.status === "active" || ticket.status === "claimed"
              ? "Ticket Valid"
              : ticket.status === "expired"
              ? "Ticket Expired"
              : ticket.status === "used"
              ? "Ticket Used"
              : ticket.status === "unused"
              ? "Ticket Unused"
              : "Ticket Status"}
          </span>
        </button>
        <div className="border border-gray-400" />
      </div>{" "}
      <div className="mx-4">
        <div
          className="border rounded-lg flex flex-col justify-center bg-white"
          id="ticket-image-container"
        >
          <div className="w-full relative overflow-hidden rounded-t-lg bg-gray-100">
            {
              ticket.bookedForBusiness.profileImage?
              (
                <img
              src={ticket?.bookedForBusiness.profileImage || restaurant?.profileImage}
              alt="item package"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = restaurant?.profileImage || Brand;
              }}
              crossOrigin="anonymous"
            />
              ) :
              <img
              src={ActivityHero}
              alt="item package"
              className="w-full h-[17rem] object-contain"
              onError={(e) => {
                e.currentTarget.src = ticket?.bookedForBusiness.profileImage || Brand;
              }}
              crossOrigin="anonymous"
            />

            }
            
          </div>
          {/* QR Code Section */}
          <div className="flex justify-center items-center py-4 bg-white">
            <QRCodeDisplay
              qrCodeDataURL={displayQRCode}
              isGenerating={isGeneratingQR}
              error={qrError}
              ticketId={ticket.ticketId}
              size="lg"
              className="flex justify-center"
            />
          </div>
          {qrError && (
            <div className="mt-2 text-center pb-4">
              <p className="text-red-600 text-sm mb-2">{qrError}</p>
              <button
                onClick={() => {
                  clearQRError();
                  if (ticket.ticketId) {
                    generateOrRetrieveQRCode(ticket.ticketId, {
                      forceRegenerate: true,
                    });
                  }
                }}
                className="text-primary underline text-sm"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-center text-center flex-col m-4 p-2 gap-2">
        <button
          className="border rounded-xl bg-primary text-white p-2 inline-flex gap-2 justify-center items-center"
          onClick={handleViewScreenTicket}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Capturing...</span>
            </>
          ) : (
            <>
              <span>View Screen Ticket</span>
            </>
          )}
        </button>
        <div>
          {/* Radix Dialog Trigger */}
          <Dialog.Root>
            <Dialog.Trigger asChild>
              <button
                disabled={notifyRedemption.isPending || ticket.status === "used"}
                aria-disabled={notifyRedemption.isPending || ticket.status === "used"}
                className={`  text-center p-2 w-full rounded-xl my-2 inline-flex gap-2 justify-center items-center ${
                  notifyRedemption.isPending || ticket.status === "used"
                    ? "opacity-90 cursor-not-allowed hover:shadow-none bg-gray-100 text-gray-300"
                    : "cursor-pointer hover:shadow-sm bg-primary/10 text-primary"
                }`}
              >
                <CalendarIcon className="w-5 h-5" />
                <span className="capitalize">Redeem Ticket</span>
              </button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 w-[95%] max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-4 shadow-lg overflow-y-auto">
                <Dialog.Title className="text-lg font-medium mb-2">
                  Redeem Ticket
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-600 mb-4">
                  Select your preferred date and time to redeem this ticket. The store will be notified to prepare your package.
                </Dialog.Description>

                <div className="space-y-4">
                  {/* Calendar Component - Only show if ticket has valid validity dates */}
                  {ticket.validityDate?.start && ticket.validityDate?.stop && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Redemption Date
                      </label>
                      <TicketRedemptionCalendar
                        selectedDate={selectedRedeemDate}
                        onDateChange={setSelectedRedeemDate}
                        validityStart={ticket.validityDate.start}
                        validityEnd={ticket.validityDate.stop}
                      />
                    </div>
                  )}

                  {/* Fallback if no validity dates */}
                  {(!ticket.validityDate?.start || !ticket.validityDate?.stop) && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={format(selectedRedeemDate, "yyyy-MM-dd")}
                        onChange={(e) => setSelectedRedeemDate(new Date(e.target.value))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  )}

                  {/* Time Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Time
                    </label>
                    <select
                      value={selectedRedeemTime}
                      onChange={(e) => setSelectedRedeemTime(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {generateTimeSlots(9, 22, 30).map((slot) => (
                        <option key={slot.value} value={slot.value}>
                          {slot.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Time will be consistent across all timezones
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 rounded-md bg-gray-100 cursor-pointer">
                      Cancel
                    </button>
                  </Dialog.Close>

                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-md bg-primary text-white cursor-pointer"
                      disabled={notifyRedemption.isPending }
                      onClick={handleRedeemTicket}
                    >
                      {notifyRedemption.isPending ? "Processing..." : "Confirm Redeem"}
                    </button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>{" "}
      {/* Serial Number - Show ticketId as serial number */}
      {ticket.ticketId && (
        <div className="m-4 flex flex-col">
          <p className="text-lg font-medium">Ticket ID</p>
          <button
            className="bg-primary/10 text-primary cursor-pointer hover:shadow-sm text-center p-2 w-full rounded-xl my-2 inline-flex gap-2 justify-center items-center"
            onClick={handleCopySerialNumber}
          >
            <Copy className="w-5 h-5" />
            <span className="uppercase">{ticket.ticketId}</span>
          </button>
        </div>
      )}{" "}
      {/* Restaurant Information - Show restaurant details if available, otherwise show booking info */}
      <div className="m-4">
        <h2 className="text-xl font-medium my-2">Store Information</h2>
        <div className="flex gap-2 shadow-sm bg-black/15 rounded-xl min-h-[96px]">
          <div className="h-[8rem] w-auto">
            <img
              src={restaurant?.profileImage || Brand}
              alt="restaurant"
              className="md:w-[10rem] h-full  object-cover rounded-l-xl"
              onError={(e) => {
                e.currentTarget.src = Brand;
              }}
            />{" "}
          </div>
          <div className="flex flex-col p-2 flex-1 gap-1">
            <h2 className="text-xl font-medium">
              {restaurant?.name ||"Store"}
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
        <button
          className="bg-primary/10 text-primary cursor-pointer hover:shadow-sm text-center p-2 w-full rounded-xl my-4 inline-flex gap-2 justify-center items-center"
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
        </button>
      </div>{" "}
      {/* Meal Package Details */}
      <div className="m-4">
        <h2 className="text-lg font-medium">Ticket Details</h2>{" "}
        <div className="flex gap-2 shadow-sm bg-black/15 rounded-xl min-h-[96px]">
          <div className="h-[8rem] w-auto">
            <img
              src={
                ticket.customImage ||
                ticket.menuItems?.[0]?.menu?.images?.[0] ||
                ticket.image ||
                Brand
              }
              alt="item package"
              className="md:w-[10rem] h-full object-cover rounded-l-xl flex-shrink-0 bg-gray-100"
              onError={(e) => {
                e.currentTarget.src = Brand;
              }}
            />
          </div>
          <div className="flex flex-col p-2 flex-1 gap-1">
            <h2 className="text-xl font-medium">
              {ticket.ticketName || "Package Ticket"}
            </h2>
            <p className="inline-flex gap-2 items-center text-sm text-gray-600">
              Booked by:{" "}
              {ticket.booking?.bookedByUser?.fullName || ticket.bookedByName}
            </p>{" "}
            <p className="text-black">
              {ticket.booking?.validityDate?.stop || ticket.validityDate?.stop
                ? `Valid until ${new Date(
                    ticket.booking?.validityDate?.stop ||
                      ticket.validityDate.stop
                  ).toLocaleDateString()}`
                : "Validity date not specified"}
            </p>
            {ticket.value && (
              <p className="text-sm text-gray-600">
                Value: {ticket.value.currency}{" "}
                {ticket.value.amount.toLocaleString()}
              </p>
            )}
          </div>
        </div>{" "}
        <div className="border border-gray-400 my-2" />{" "}
        <p className="text-center text-sm">
          {ticket.booking?.reason && (
            <span className="block mb-2 italic">"{ticket.booking.reason}"</span>
          )}
          {ticket.booking?.validityDate?.stop || ticket.validityDate?.stop
            ? `Kindly note that this ticket is valid until ${new Date(
                ticket.booking?.validityDate?.stop || ticket.validityDate.stop
              ).toLocaleDateString()}`
            : "Please check with the store for validity information"}
        </p>
        {/* Status information */}
        <div className="mt-4 p-3 rounded-lg bg-gray-50">
          <p className="text-sm font-medium">
            Status:
            <span
              className={`ml-2 px-2 py-1 rounded-full text-xs ${
                ticket.status === "active"
                  ? "bg-blue-100 text-blue-800"
                  : ticket.status === "claimed"
                  ? "bg-green-100 text-green-800"
                  : ticket.status === "used"
                  ? "bg-gray-100 text-gray-800"
                  : ticket.status === "expired"
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </p>{" "}
          <p className="text-sm text-gray-600 mt-1">
            Booked by:{" "}
            {ticket.booking?.bookedByUser?.fullName || ticket.bookedByName}
          </p>
          {ticket.status === "claimed" && ticket.claimedByUser && (
            <p className="text-sm text-gray-600 mt-1">
              Claimed by: {ticket.claimedByUser.fullName}
            </p>
          )}
        </div>
      </div>{" "}
      {/* Ticket Interactions Section */}
      {}
      <div className="m-4 space-y-4">
        {/* Reactions Section */}
        <div className="border rounded-lg p-4 bg-white">
          {" "}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Reactions
            </h3>
          </div>
          {/* Current User's Reaction Display */}
          {/* Reaction Buttons - Always Visible */}
          <div className="space-y-3">
            {" "}
            <div className="flex justify-around gap-2">
              {(["like", "love", "wow", "sad", "angry"] as const).map(
                (reaction) => {
                  const hasUserReacted = currentReaction === reaction;
                  const count = hasUserReacted ? 1 : 0;

                  return (
                    <button
                      key={reaction}
                      onClick={() => handleReaction(reaction)}
                      disabled={isPostingReaction}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all transform ${
                        hasUserReacted
                          ? "bg-orange-200 text-orange-700 border-orange-300 scale-110"
                          : "bg-gray-50 hover:bg-orange-100 text-gray-600 border-gray-200"
                      } ${
                        isReactionAnimating && hasUserReacted
                          ? "animate-bounce"
                          : ""
                      }`}
                    >
                      <span className="text-lg">
                        {reaction === "like" && "👍"}
                        {reaction === "love" && "❤️"}
                        {reaction === "wow" && "😮"}
                        {reaction === "sad" && "😢"}
                        {reaction === "angry" && "😠"}
                      </span>
                      <span className="text-xs font-medium">{count}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>{" "}
          {/* Always Visible Reaction Summary */}
          {/* {currentReaction && (
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="inline-flex px-3 py-1 rounded-full text-sm items-center gap-1">
                <span className="text-base">
                  {currentReaction === "like" && "👍"}
                  {currentReaction === "love" && "❤️"}
                  {currentReaction === "wow" && "😮"}
                  {currentReaction === "sad" && "😢"}
                  {currentReaction === "angry" && "😠"}
                </span>
                <span className="font-medium">1</span>{" "}
              </span>
            </div>
          )}          {reactionError && (
            <p className="text-red-500 text-sm mt-2">{reactionError.message}</p>
          )} */}
          {/* View All Engagement Button */}
          {/* <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              onClick={() =>
                navigate(`/engagement/${ticket.ticketId}`, {
                  state: { 
                    ticketData: ticket,
                    bookingId: ticket.bookingId 
                  },
                })
              }
              className="w-full bg-primary/10 text-primary border border-primary/20 rounded-lg p-3 hover:bg-primary/20 transition-colors"
            >
              View All Engagement
            </Button>
          </div> */}
        </div>

        {/* Messages Section */}
        <div className="border rounded-lg p-4 bg-white">
          {" "}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              Messages
            </h3>
            <button
              onClick={() => setShowMessages(!showMessages)}
              className="text-sm text-primary"
            >
              {showMessages ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
          {showMessages && (
            <>
              {/* Messages List */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {currentMessage ? (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">
                        {ticket.claimedByUser?.fullName ||
                          ticket.claimedByName ||
                          "User"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(
                          ticket.updatedAt || ticket.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{currentMessage}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No messages yet. Be the first to leave a message!
                  </p>
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Write a message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />{" "}
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isPostingMessage}
                  className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isPostingMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {messageError && (
                <p className="text-red-500 text-sm mt-2">
                  {messageError.message}
                </p>
              )}
            </>
          )}
        </div>
      </div>{" "}
      {/* Click outside to close reaction dropdown - No longer needed */}
    </div>
  );
};

export default TicketView;
