import { useState } from "react";
import Button from "@/components/Button";
import FormField from "@/components/FormField";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import LocationIcon from "@/assets/svg/location_searching.svg";
import Title from "./Title";
import BackIcon from "@/assets/svg/back.svg";
import LocationOn from "@/assets/svg/location_on.svg";

const ConfirmAddress: React.FC = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
  });

  const handleUseCurrentLocation = async () => {
    const { getSafeLocation, isIOSDevice } = await import("@/utils/iosLocationFix");

    try {
      setIsLoadingLocation(true);
      setLocationError("");

      const result = await getSafeLocation({
        enableHighAccuracy: !isIOSDevice(), // iOS prefers false
        timeout: isIOSDevice() ? 15000 : 10000,
        maximumAge: 300000,
        fallbackToIP: true
      });

      if (result.success && result.position) {
        setIsLoadingLocation(false);
        // Reverse geocode to get address from coordinates
        console.log("Coordinates:", result.position.coords);
        setAddress("Detecting your address...");

        // For demo purposes, we'll simulate an address
        setTimeout(() => {
          setAddress("123 Main St, Your City");
        }, 1500);
      } else {
        setIsLoadingLocation(false);
        setLocationError(result.error || "Unable to retrieve your location. Please enter your address manually.");
      }
    } catch (error) {
      setIsLoadingLocation(false);
      setLocationError("Geolocation service is unavailable. Please enter your address manually.");
      console.error("Geolocation error:", error);
    }
  };

  const onFormSubmit = () => {
    if (!address.trim()) return;
    navigate("/auth/signin");
  };

  return (
    <div className="flex flex-col h-screen md:flex-row overflow-hidden md:justify-center md:items-center">
      {/* Left side - Form */}
      <div className="md:flex-1 flex flex-col p-6 ">
        <button
          type="button"
          className="text-primary hover:text-primary-dark flex items-center mt-4 mb-8 mx-6 md:hidden"
          onClick={() => navigate(-1)}
        >
          <img src={BackIcon} alt="back" className="" />
        </button>
        <div className="w-full max-w-md">
          <Title
            title="Confirm your address"
            description="To get started, please confirm your address."
            className="mb-8"
            titleClassName="text-2xl font-semibold text-gray-800"
            descriptionClassName="text-gray-600 hidden md:block"
          />

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            <FormField
              name="address"
              type="text"
              register={register}
              errors={errors}
              placeholder="Street address or zip code"
              inputClassName="p-4 border-b border-gray-300 focus:outline-none focus:border-primary w-full"
              icon={
                <img src={LocationOn} alt="address icon" className="w-5 h-5 " />
              }
              iconPosition="left"
            />

            <Button
              type="button"
              className="h-14 w-full border-b border-gray-300 text-primary bg-white hover:bg-gray-50 transition-colors flex items-center  gap-3"
              handleClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <svg
                  className="animate-spin h-5 w-5 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <div className="flex items-center gap-3">
                  <img src={LocationIcon} alt="location" className="w-5" />
                  <div>
                    <p className="font-normal text-black">
                      Use Current Location
                    </p>
                    <p className="text-[#CAC4D0] text-sm">
                      Find your current location
                    </p>
                  </div>
                </div>
              )}
            </Button>

            {locationError && (
              <p className="text-red-500 text-sm">{locationError}</p>
            )}

            <Button
              type="submit"
              className="h-14 w-full rounded-lg bg-primary hover:bg-primary-dark transition-colors"
              disabled={!address.trim()}
            >
              <span className="text-white font-medium">Confirm Address</span>
            </Button>
          </form>
        </div>
      </div>

      {/* Right side - Image/Illustration (desktop only) */}
      <div className="hidden md:flex md:w-1/2 md:min-h-screen md:bg-gray-50 md:items-center md:justify-center">
        <div className="max-w-md p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Why we need your location
          </h2>
          <ul className="space-y-4 text-gray-600">
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Find restaurants closest to you</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Show accurate delivery estimates</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary">•</span>
              <span>Personalize your experience</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAddress;
