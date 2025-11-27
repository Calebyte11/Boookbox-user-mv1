import SuccessPng from "@/assets/images/success.jpg";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { queryClient } from "@/services/queryClient";
import { queryKeys } from "@/hooks/useUserQueries";
import { useEffect } from "react";

const Success = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paymentData = location.state;
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    // Always invalidate queries when the success page loads
    queryClient.invalidateQueries({
      queryKey: queryKeys.Bookings.gifts(),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.Bookings.all(),
    });
    queryClient.invalidateQueries({
      queryKey: queryKeys.Tickets.all(),
    });

    // If we have a specific booking ID, also invalidate that booking's details
    if (bookingId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.Bookings.detail(bookingId),
      });
    }
  }, [paymentData, bookingId]);

  return (
    <div className="flex flex-col justify-center items-center overflow-y-hidden h-full">
      <img
        src={SuccessPng}
        alt="Success"
        className="md:w-[30%] lg:w-[35%] mb-4 "
      />
      <h2 className="text-xl text-center py-4 mx-4 ">
        You have successfully booked a meal package.
      </h2>

      <div className="w-full flex justify-center items-center">
        <Link
          to={bookingId ? `/receipt/${bookingId}` : "/receipt"}
          state={paymentData} // Pass payment data to receipt page (as fallback)
          className="mt-8 bg-[#FF7A00] py-2.5 rounded-lg text-white w-full max-w-[380px] mx-4 text-center self-center"
        >
          <span>View Receipt</span>
        </Link>
      </div>
    </div>
  );
};

export default Success;
