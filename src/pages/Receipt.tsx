import Button from "@/components/Button";
import { ReceiptSkeleton } from "@/components/SkeletonLoader";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import { Container } from "@radix-ui/themes";
import { useBookingDetailQuery } from "@/hooks/useUserQueries";

// Enhanced receipt data structure with comprehensive booking information
type DisplayReceiptData = {
  transactionId: string | number;
  paymentReference: string;
  paymentDate?: string;
  bookingDetails: {
    // Core booking info
    bookingId?: string;
    status?: string;
    bookingType?: string;
    
    // User and recipient info
    bookedByUser?: {
      fullName?: string;
      email?: string;
      organizationName?: string;
      phoneNumber?: string;
    } | null;
    recipientDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      [key: string]: unknown;
    } | null;
    
    // Restaurant info
    restaurantName: string | null;
    restaurantAddress?: string;
    restaurantPhone?: string;
    
    // Timing info
    deliveryDate: string | null;
    deliveryTime: string | null;
    bookedAt?: string;
    
    // Booking settings
    redemptionMode?: string;
    includeUtensils?: boolean;
    numberOfRecipients?: number;
    supportsMultipleClaims?: boolean;
    
    // Financial info
    totalAmount: number;
    deliveryFee?: number;
    boookboxFee?: number;
    
    // Items and instructions
    specialInstructions: string | null;
    items: Array<{
      id: string;
      mealId: string;
      mealName: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
      userInstruction?: string;
    }>;
    itemCount: number;
    totalMeals: number;
    
    // Validity info
    validityStart?: string;
    validityEnd?: string;
  };
};

// itemRaw type for booking.source items
type ItemRaw = {
  _id?: string;
  id?: string;
  product?: { name?: string; price?: number; menuId?: string };
  item?: { name?: string; price?: number };
  mealId?: string;
  itemId?: string;
  mealName?: string;
  itemName?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  pricePerUnit?: number;
  totalPrice?: number;
  instructions?: string;
  userInstruction?: string;
  instruction?: string;
};

const Receipt = () => {
  const navigate = useNavigate();
  const { id: bookingId } = useParams<{ id: string }>();
  
  // Fetch booking details from API
  const { data: bookingData, isLoading: loadingBooking, error: bookingError } = 
    useBookingDetailQuery(bookingId || "", { enabled: !!bookingId });
  
  const [displayData, setDisplayData] = useState<DisplayReceiptData | null>(null);

  useEffect(() => {
    if (bookingData && !loadingBooking) {
      // Use API data as primary source
      const booking = Array.isArray(bookingData) ? bookingData[0] : bookingData;
      
      console.log("📋 Fetched booking data for receipt:", booking);
      
      // Transform API booking data to receipt format
      // Prefer `menuItems` (API shape) but fall back to `items`
      const sourceItems = booking.menuItems || booking.items || [];

      const transformedData: DisplayReceiptData = {
        transactionId: booking.paymentReference || booking.transactionId || booking._id || "N/A",
        paymentReference: booking.paymentReference || "N/A",
        paymentDate: booking.updatedAt || booking.createdAt || new Date().toISOString(),
        bookingDetails: {
          // Core booking info
          bookingId: booking.bookingId || booking._id || booking.id,
          status: booking.status,
          bookingType: booking.bookingType || "gift",
          
          // User and recipient info
          bookedByUser: booking.bookedByUser ? {
            fullName: booking.bookedByUser.fullName,
            email: booking.bookedByUser.email,
            organizationName: booking.bookedByUser.organizationName,
            phoneNumber: booking.bookedByUser.phoneNumber,
          } : null,
          recipientDetails: booking.recipientDetails || null,
          
          // Restaurant info
          restaurantName: booking.bookedAtBusiness.name || booking.bookedAtBusiness?.name || null,
          restaurantAddress: booking.bookedAtBusiness?.address,
          restaurantPhone: booking.bookedAtBusiness?.phone,
          
          // Timing info
          deliveryDate: booking.deliveryDate || booking.validityDate?.start || null,
          deliveryTime: booking.deliveryTime || null,
          bookedAt: booking.bookedAt || booking.createdAt,
          
          // Booking settings
          redemptionMode: booking.redemptionMode,
          includeUtensils: booking.includeUtensils,
          numberOfRecipients: booking.numberOfRecipients || booking.numberOfBookings || 1,
          supportsMultipleClaims: booking.supportsMultipleClaims,
          
          // Financial info
          totalAmount: booking.totalAmount || booking.paymentAmount || 0,
          deliveryFee: booking.deliveryFee,
          boookboxFee: booking.boookboxFee,
          
          // Instructions
          specialInstructions: booking.reason || booking.specialInstructions || null,
          
          // Validity info
          validityStart: booking.validityDate?.start,
          validityEnd: booking.validityDate?.stop,
          
          // Map raw source items to canonical items and compute counts from mapped items
          items: (() => {
            const mapped = (sourceItems || []).map((itemRaw: ItemRaw) => {
              const menu = itemRaw.product || itemRaw.item || {};
              const qty = itemRaw.quantity || itemRaw.qty || 1;
              const price = menu.price ?? itemRaw.price ?? itemRaw.pricePerUnit ?? 0;

              return {
                id: itemRaw._id || itemRaw.id || "",
                mealId: (menu as { menuId?: string }).menuId || itemRaw.mealId || itemRaw.itemId || "",
                mealName: (menu as { name?: string }).name || itemRaw.mealName || itemRaw.itemName || "Unknown Meal",
                quantity: qty,
                pricePerUnit: price,
                totalPrice: (price || 0) * (qty || 1),
                userInstruction: itemRaw.instructions || itemRaw.userInstruction || itemRaw.instruction || "",
              };
            });
            return mapped;
          })(),
          itemCount: (() => (sourceItems || []).length || 0)(),
          totalMeals: (() => {
            const mapped = (sourceItems || []).map((it: ItemRaw) => it.quantity || it.qty || 1);
            return mapped.reduce((sum: number, v: number) => sum + (v || 0), 0) || 0;
          })(),
        },
      };
      
      setDisplayData(transformedData);
    }
  }, [bookingData, loadingBooking, bookingId]);

  // Show loading state
  if (loadingBooking) {
    return <ReceiptSkeleton />;
  }
  
  // Show error state
  if (bookingError) {
    return (
      <Container className="" size={"4"}>
        <div className="flex items-center">
          <Button
            className="rounded-xl p-2 bg-[#ECE6F0] self-start"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6 text-black text-xl" />
          </Button>
          <h1 className="text-2xl self-center text-center w-full font-semibold">
            Receipt
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-red-500 text-lg mb-4">Failed to load receipt data</p>
          <p className="text-gray-500 text-sm mb-4">Could not fetch booking details</p>
          <Button
            onClick={() => navigate("/gifts")}
            className="bg-[#FF7A00] text-white px-6 py-2 rounded-lg"
          >
            View My Gifts
          </Button>
        </div>
      </Container>
    );
  }

  // If no data available, show skeleton
  if (!displayData) {
    return <ReceiptSkeleton />;
  }

  const {
    transactionId,
    paymentDate,
    // paymentReference,
    bookingDetails,
  } = displayData || {};

  const {
    // Core booking info
    // bookingId: displayBookingId,
    status,
    bookingType,
    
    // User and recipient info
    // bookedByUser,
    recipientDetails,
    
    // Restaurant info
    restaurantName,
    // restaurantAddress,
    // restaurantPhone,
    
    // Timing info
    deliveryDate,
    // deliveryTime,
    bookedAt,
    
    // Booking settings
    redemptionMode,
    includeUtensils,
    numberOfRecipients,
    // supportsMultipleClaims,
    
    // Financial info
    totalAmount,
    // deliveryFee,
    // boookboxFee,
    
    // Instructions and items
    specialInstructions,
    items,
    itemCount,
    totalMeals,
    
    // Validity info
    validityStart,
    validityEnd,
  } = bookingDetails || {};

  // Use the pre-calculated totalMeals from the receipt store
  // Fallback calculation for backward compatibility
  let finalTotalMeals = totalMeals;
  if (!finalTotalMeals && items) {
    if (Array.isArray(items)) {
      finalTotalMeals = items.reduce((total, item) => {
        if (typeof item === "number") return total + item;
        if (item && typeof item === "object" && "quantity" in item) {
          return total + (item.quantity || 1);
        }
        return total + 1;
      }, 0);
    } else if (typeof items === "number") {
      finalTotalMeals = items;
    }
  }

  // Use stored payment date or fallback to current date
  const formattedPaymentDate = paymentDate
    ? new Date(paymentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  // Helper to display amounts that might be in kobo (smallest unit) or in Naira
  const formatAmountForDisplay = (value?: number | null) => {
    if (value == null) return "-";
    // If value looks like a full Naira amount (e.g. 5250), show as-is.
    // If value is small (<= 1000) it's likely in kobo, so divide by 100.
    // This heuristic covers both API shapes.
    const asNumber = Number(value) || 0;
    if (asNumber > 1000) {
      return formatCurrency(asNumber, "NGN");
    }
    return formatCurrency(asNumber / 100, "NGN");
  };



  return (
    <Container className="" size={"4"}>
      <div className="flex items-center">
        <Button
          className="rounded-xl p-2 bg-[#ECE6F0] self-start"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="h-6 w-6 text-black text-xl" />
        </Button>
        <h1 className="text-2xl self-center text-center w-full font-semibold">
          Receipt
        </h1>
      </div>
      <div>
        {/* Payment Receipt Section */}
        <div className="mx-2 mb-2 justify-center flex flex-col items-center">
          <h2 className="text-black lg:text-2xl text-xl font-semibold my-3">
            Payment Successful 
          </h2>
          <div className="my-2">
            <p className="py-2 text-center">
              Your payment has been processed successfully. Your booking is
              confirmed.
            </p>
            <div className="bg-[#F7FAFC] flex flex-col m-2 gap-2 p-4 ">
              <div className="flex justify-between my-3 text-lg md:text-lg">
                <p>Transaction ID</p>
                <p className="font-mono text-sm">{transactionId}</p>
              </div>
              
              {/* {displayBookingId && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Booking ID</p>
                  <p className="font-mono text-sm">{displayBookingId}</p>
                </div>
              )} */}
              
              <div className="flex justify-between my-3 text-lg md:text-lg">
                <p>Amount Paid</p>
                <p className="font-semibold text-primary font-mono">
                  {formatAmountForDisplay(totalAmount)}
                </p>
              </div>
              
              {/* Fee Breakdown */}
              {/* {(deliveryFee !== undefined || boookboxFee !== undefined) && (
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <p className="text-black font-medium mb-2">Payment Breakdown:</p>
                  {deliveryFee !== undefined && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <p>Delivery Fee</p>
                      <p>{formatAmountForDisplay(deliveryFee)}</p>
                    </div>
                  )}
                  {boookboxFee !== undefined && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <p>BoookBox Fee</p>
                      <p>{formatAmountForDisplay(boookboxFee)}</p>
                    </div>
                  )}
                </div>
              )} */}
              
              <div className="flex justify-between my-3 text-lg md:text-lg">
                <p>Payment Date</p>
                <p className="font-mono text-sm">{formattedPaymentDate}</p>
              </div>
              
              {status && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Status</p>
                  <p className="capitalize font-medium text-green-600 font-mono text-sm">{status}</p>
                </div>
              )}
              
              <div className="flex justify-between my-3 text-lg md:text-lg">
                <p>Store</p>
                <p className="font-mono text-sm">{restaurantName || "-"}</p>
              </div>
              
              {/* {restaurantAddress && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Restaurant Address</p>
                  <p className="text-right text-sm">{restaurantAddress}</p>
                </div>
              )}
              
              {restaurantPhone && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Restaurant Phone</p>
                  <p>{restaurantPhone}</p>
                </div>
              )} */}
              
              <div className="flex justify-between my-3 text-lg ">
                <p>Booking Type</p>
                <p className="capitalize font-mono text-sm">{bookingType || "Booking"}</p>
              </div>
              
              {redemptionMode && (
                <div className="flex justify-between my-3 text-lg ">
                  <p>Redemption Mode</p>
                  <p className="capitalize font-mono text-sm">{redemptionMode}</p>
                </div>
              )}
              
              {includeUtensils !== false && (
                <div className="flex justify-between my-3 text-lg ">
                  <p>Include Utensils</p>
                  <p className="font-mono text-sm">{includeUtensils ? "Yes" : "No"}</p>
                </div>
              )}
              
              {numberOfRecipients && numberOfRecipients > 1 && (
                <div className="flex justify-between my-3 text-lg ">
                  <p>Number of Bookings</p>
                  <p className="font-mono text-sm">{numberOfRecipients}</p>
                </div>
              )}
              
              {bookedAt && (
                <div className="flex justify-between my-3 text-lg ">
                  <p>Booked At</p>
                  <p className="font-mono text-sm">{new Date(bookedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}</p>
                </div>
              )}
              
              <div className="flex justify-between my-3 text-lg md:text-lg">
                <p>Valid From</p>
                <p className="font-mono text-sm">
                  {validityStart
                    ? new Date(validityStart).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : deliveryDate
                    ? new Date(deliveryDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Check booking details"}
                </p>
              </div>
              
              {validityEnd && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Valid Until</p>
                  <p className="font-mono text-sm">{new Date(validityEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</p>
                </div>
              )}
              
              <div className="flex justify-between my-3 text-lg md:text-lg">
                <p>Items Ordered</p>
                <p className="font-mono text-sm">{finalTotalMeals} item(s)</p>
              </div>
              
              {itemCount && itemCount !== finalTotalMeals && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Unique Items</p>
                  <p className="font-mono text-sm">{itemCount} type(s)</p>
                </div>
              )}
              {/* Individual Item Details */}
              {items && items.length > 0 && (
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <p className="text-black font-medium mb-3">Order Details:</p>
                  {items.map((item: DisplayReceiptData['bookingDetails']['items'][0], index: number) => (
                    <div key={item.id || index} className="mb-3 pb-2 border-b border-gray-200 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-black">{item.mealName}</p>
                          <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                          {item.userInstruction && (
                            <p className="text-gray-500 text-sm italic ">
                              Note: {item.userInstruction}
                            </p>
                          )}
                        </div>
                        <p className="font-medium text-black">
                          {formatAmountForDisplay(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Booked By Information */}
              {/* {bookedByUser && (
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <p className="text-black font-medium mb-2">Booked By:</p>
                  {bookedByUser.organizationName && (
                    <div className="flex justify-between text-sm">
                      <p>Organization</p>
                      <p>{bookedByUser.organizationName}</p>
                    </div>
                  )}
                  {bookedByUser.fullName && (
                    <div className="flex justify-between text-sm">
                      <p>Name</p>
                      <p>{bookedByUser.fullName}</p>
                    </div>
                  )}
                  {bookedByUser.email && (
                    <div className="flex justify-between text-sm">
                      <p>Email</p>
                      <p>{bookedByUser.email}</p>
                    </div>
                  )}
                  {bookedByUser.phoneNumber && (
                    <div className="flex justify-between text-sm">
                      <p>Phone</p>
                      <p>{bookedByUser.phoneNumber}</p>
                    </div>
                  )}
                </div>
              )} */}
              
              {recipientDetails?.name && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Recipient</p>
                  <p>{recipientDetails.name}</p>
                </div>
              )}
              
              {specialInstructions && (
                <div className="flex justify-between my-3 text-lg md:text-lg">
                  <p>Booking Reason</p>
                  <p className="text-right text-sm">{specialInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="w-full flex justify-center items-center flex-col md:flex-row gap-3 px-4 mt-8">
        <Button
          onClick={() => navigate("/gifts")}
          className="mt-2 bg-[#FF7A00] p-2 rounded-lg text-white w-full max-w-[380px] mx-4 "
        >
          <span>View My Gifts</span>
        </Button>
        <Button
          onClick={() => navigate("/home")}
          className="mt-2 bg-[#FF7A00]/10 text-primary p-2 rounded-lg w-full max-w-[380px] mx-4 "
        >
          <span>Go Back Home</span>
        </Button>
      </div>
    </Container>
  );
};

export default Receipt;
