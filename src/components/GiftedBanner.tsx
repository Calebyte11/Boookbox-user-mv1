import useAuthStore from "@/store/authStore";
import splash from "@/assets/images/splashScreenImage.jpg";
import { useNavigate } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { useGiftedBookingsQuery } from "@/hooks/useUserQueries";
import {
  useState,
  //  useEffect
} from "react";
import Button from "@/components/Button";
// import BrandTitle from "./BrandTitle";

interface GiftedBannerProps {
  isOpen?: boolean;
  onClose?: () => void;
  newGiftId?: string; // ID of the new gift to display
}

const GiftedBanner = ({ onClose, newGiftId }: GiftedBannerProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: giftedBookingsData,
    isLoading: isGiftedLoading,
    error: giftedError,
  } = useGiftedBookingsQuery();

  // Get the specific new gift or the first available gift booking
  const giftBooking = newGiftId
    ? giftedBookingsData?.data?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (booking: any) =>
          booking._id === newGiftId || booking.bookingId === newGiftId
      )
    : giftedBookingsData?.data?.[0] || null;

  // Close popup when clicking outside or pressing Escape
  // useEffect(() => {
  //   const handleEscape = (e: KeyboardEvent) => {
  //     if (e.key === "Escape" && isOpen) {
  //       // onClose();
  //     }
  //   };

  //   if (isOpen) {
  //     document.addEventListener("keydown", handleEscape);
  //     document.body.style.overflow = "hidden"; // Prevent background scrolling
  //   }

  //   return () => {
  //     document.removeEventListener("keydown", handleEscape);
  //     document.body.style.overflow = "unset";
  //   };
  // }, [isOpen, onClose]);

  const handleClaimTicket = () => {
    if (giftBooking?.bookingId || giftBooking?._id) {
      const bookingId = giftBooking.bookingId || giftBooking._id;
      setIsLoading(true);

      // Close popup and navigate to claim ticket page
      setTimeout(() => {
        setIsLoading(false);
        // onClose(); // Close the popup
        navigate(`/tickets/claim/${bookingId}`);
      }, 500);
    }
  };

  // const handleViewAllGifts = () => {
  //   onClose();
  //   navigate("/gifts");
  // };
  // Don't render if not open
  // if (!isOpen) return null;

  // Loading state
  if (isGiftedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary mr-2 mx-auto mb-4" />
          <span className="text-gray-600">Loading your gifts...</span>
        </div>
      </div>
    );
  }

  // Error or no gift state
  if (giftedError || !giftBooking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">
            {giftedError ? "Error loading gifts" : "No gifts available"}
          </h2>
          <p className="text-gray-500 mb-6">
            {giftedError
              ? "Please try again later"
              : "You don't have any gift bookings at the moment"}
          </p>
          <button
            onClick={onClose}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-hidden flex flex-col md:h-screen md:flex-row-reverse md:items-center md:gap-4 md:justify-center h-dvh ">
      {/* Content Container */}
      <div className="flex flex-col mx-6 z-10 md:mx-auto md:w-1/2 md:max-w-md md:px-0  md:mt-0 pt-[8rem]">
        {/* <BrandTitle
          title="BoookBox"
          description="Sponsor meals from any restaurant in the world."
          className="text-center mb-12 mt-[4rem] md:mt-0 flex flex-col items-center justify-center "
          titleClassName="text-6xl font-bold font-inter mx-auto text-primary"
          descriptionClassName="text-lg text-black font-mf"
          brandImg={true}
        /> */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="max-w-md mx-auto w-full">
            <div className="space-y-6">
              {/* Personalized Message */}
              <div className="text-center ">
                <p className="text-2xl text-black mb-4 font-medium">
                  {`Hi ${user?.username}!`}
                </p>
                <p className="text-lg text-gray-600">
                  <span className="font-semibold text-primary">
                    {giftBooking.bookedByName || "Someone"}
                  </span>{" "}
                  has gifted you a meal ticket!
                </p>
              </div>
            </div>
          </div>
          <Button
            className="bg-primary h-[3.15rem] md:h-14 rounded-xl transition-colors hover:bg-primary/90"
            handleClick={handleClaimTicket}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="animate-spin h-5 w-5 mr-2 text-white" />
                Claiming...
              </div>
            ) : (
              <span className="text-center text-white font-medium text-lg">
                Claim Meal Ticket Now
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex md:w-1/2 md:h-screen md:items-center md:justify-center">
        <img
          src={splash}
          alt="Illustration"
          className="object-contain   z-auto md:hidden"
        />
        <img
          src={splash}
          alt="Illustration"
          className="md:w-full md:p-8 object-contain md:mt-auto z-auto md:block hidden self-end"
        />
      </div>
    </section>
  );
};

export default GiftedBanner;
