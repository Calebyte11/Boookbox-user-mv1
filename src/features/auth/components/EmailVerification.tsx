import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import BrandTitle from "@/components/BrandTitle";
import Button from "@/components/Button";
import OtpInput from "@/components/OtpInput";
import Title from "./Title";
import { RotateCcw } from "lucide-react";
import SplashImage from "@/assets/images/splash-2.jpg";
import {
  useEmailVerificationMutation,
  useResendVerificationMutation,
} from "@/features/auth/hooks/useEmailVerification";
import { useToast } from "@/hooks/useToast";
import useAuthStore from "@/store/authStore";
import { useLocation } from "react-router-dom";
interface EmailVerificationProps {
  email?: string;
  onResend?: () => Promise<void>;
}

interface VerificationFormData {
  otp: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onResend,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [countdown, setCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const location = useLocation();
  // Use the backend verification hooks
  const emailVerificationMutation = useEmailVerificationMutation();
  const resendVerificationMutation = useResendVerificationMutation();

  // Get email from user if not provided as prop
  const userEmail = location.state?.email || email || user?.email;

  const {
    // register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<VerificationFormData>({
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const otpValue = watch("otp");

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      if (userEmail) {
        const response = await resendVerificationMutation.mutateAsync(
          userEmail
        );
        if (response.success) {
          toast({
            title: "Code Resent",
            description: "A new verification code has been sent to your email.",
            variant: "success",
          });
          setCountdown(30); // Reset countdown
        }
      } else if (onResend) {
        await onResend();
        setCountdown(30); // Reset countdown
      }
    } catch (error) {
      console.error("Failed to resend verification code:", error);
      toast({
        title: "Failed to resend code",
        description: "Please try again later.",
        variant: "error",
      });
    } finally {
      setIsResending(false);
    }
  };
  const onSubmit = async (data: VerificationFormData) => {
    if (!userEmail) {
      toast({
        title: "Error",
        description: "Email address is required for verification.",
        variant: "error",
      });
      return;
    }

    try {
      const response = await emailVerificationMutation.mutateAsync({
        email: userEmail,
        code: data.otp,
      });

      if (response.success) {
        toast({
          title: "Email Verified Successfully",
          description:
            "Your email has been verified. You can now access all features.",
          variant: "success",
        });

        // Navigate to dashboard or next step
        navigate("/");
      } else {
        throw new Error(response.message || "Verification failed");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast({
        title: "Verification Failed",
        description:
          error instanceof Error
            ? error.message
            : "Invalid verification code. Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Brand (always visible on desktop) */}
      <div className="md:w-1/2 md:min-h-screen md:flex md:items-center md:justify-center md:bg-[#f8f6f9]">
        <div className="mx-6 md:mx-auto md:max-w-md md:w-full">
          <BrandTitle
            description="Sponsor meals from any restaurant in the world."
            className="text-center my-12 flex flex-col items-center justify-center"
            titleClassName="text-6xl font-bold font-inter text-[#FF7A00]"
            descriptionClassName="text-lg text-gray-700"
            brandImg
          />
          <div className="md:block hidden">
            <img
              src={SplashImage}
              alt="Illustration"
              className="bg-inherit object-cover w-full"
            />
          </div>
        </div>
      </div>

      {/* Right side - Verification content */}
      <div className="md:flex-1 flex items-center justify-center p-6 md:p-0">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              {" "}
              <Title
                title="Verify your email"
                description={`We've sent a 6-digit code to ${
                  userEmail || "your email"
                }`}
              />
              <div className="space-y-4">
                <OtpInput
                  value={otpValue}
                  onChange={(value) => {
                    setValue("otp", value);
                    trigger("otp");
                  }}
                  numberOfInputs={6}
                  hasError={!!errors.otp}
                />

                {errors.otp && (
                  <p className="text-red-500 text-sm">{errors.otp.message}</p>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className={`text-sm font-medium flex items-center gap-1 ${
                      countdown > 0 || isResending
                        ? "text-gray-400"
                        : "text-[#FF7A00] hover:text-[#FF7A00]/90"
                    }`}
                  >
                    {isResending ? (
                      "Sending..."
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 " />
                        {countdown > 0
                          ? `Resend in ${countdown}s`
                          : "Resend code"}
                      </>
                    )}
                  </button>
                </div>
              </div>{" "}
              <Button
                type="submit"
                disabled={!isValid || emailVerificationMutation.isPending}
                className={`h-14 w-full rounded-lg ${
                  isValid
                    ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                    : "bg-[#FF7A00]/50 text-white cursor-not-allowed"
                } transition-colors`}
              >
                {emailVerificationMutation.isPending
                  ? "Verifying..."
                  : "Verify and Continue"}
              </Button>
              <button
                type="button"
                onClick={() => navigate("/auth/login")}
                className="w-full mt-4 py-3 rounded-lg border border-[#FF7A00] text-[#FF7A00] font-medium hover:bg-[#FF7A00]/10 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile splash image */}
      <div className="md:hidden z-[-10]">
        <img
          src={SplashImage}
          alt="Illustration"
          className="md:hidden object-contain mt-[-10rem] w-full"
        />
      </div>
    </div>
  );
};

export default EmailVerification;