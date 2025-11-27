import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import OtpInput from "@/components/OtpInput";
import Button from "@/components/Button";
import FormField from "@/components/FormField";
import { RotateCcw, ArrowLeft } from "lucide-react";
import {
  useForgotPasswordMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "@/features/auth/hooks/authQueries";
import { useToast } from "@/hooks/useToast";
import BrandTitle from "@/components/BrandTitle";
import { useNavigate } from "react-router-dom";

// Validation schemas
const emailSchema = yup.object().shape({
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
});

const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .length(6, "OTP must be 6 digits")
    .required("OTP is required"),
});

interface EmailFormData {
  email: string;
}

interface OtpFormData {
  otp: string;
}

/**
 * Extract error message from error object
 */
function extractErrorMessage(error: unknown, defaultMessage = "An error occurred"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as { message: unknown };
    if (typeof err.message === 'string') {
      return err.message;
    }
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}

const ForgetPassword = () => {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const verifyOtpMutation = useVerifyOtpMutation();
  const resendOtpMutation = useResendOtpMutation();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "otp">("email");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema),
    mode: "onChange",
  });

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: yupResolver(otpSchema),
    mode: "onChange",
  });

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (data: EmailFormData) => {
    setEmail(data.email);

    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => {
        setStep("otp");
        setCountdown(30); // Start 30-second countdown
      },
      onError: (error: unknown) => {
        console.error("Failed to send OTP:", error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to send verification code. Please try again."
        );
        emailForm.setError("root", {
          type: "manual",
          message: errorMessage,
        });
      },
    });
  };

  const handleOtpSubmit = async (data: OtpFormData) => {
    const cleanOtp = data.otp.trim();
    
    console.log("🎯 Submitting OTP verification:");
    console.log("  Email:", email);
    console.log("  OTP:", cleanOtp);
    console.log("  OTP Length:", cleanOtp.length);
    console.log("  OTP Type:", typeof cleanOtp);
    
    verifyOtpMutation.mutate(
      { email, otp: cleanOtp },
      {
        onSuccess: (response: unknown) => {
          console.log("✅ OTP verification successful:", response);
          
          // Type guard for response object
          let token: string | undefined;
          
          if (response && typeof response === 'object') {
            const resp = response as Record<string, unknown>;
            
            // Extract token from multiple possible locations
            if (typeof resp.token === 'string') {
              token = resp.token;
            } else if (typeof resp.resetToken === 'string') {
              token = resp.resetToken;
            } else if (resp.data && typeof resp.data === 'object') {
              const data = resp.data as Record<string, unknown>;
              if (typeof data.token === 'string') {
                token = data.token;
              }
            }
          }
          
          if (!token) {
            console.warn("⚠️ No token found in response, but verification succeeded");
          }
          
          // Show success toast
          toast({
            title: "Code Verified Successfully",
            description: "You can now create a new password.",
            variant: "success",
          });

          // Navigate to create new password page with token
          navigate("/auth/create-new-password", {
            state: {
              email: email,
              token: token,
              data: response,
            },
          });
        },
        onError: (error: unknown) => {
          console.error("❌ Failed to verify OTP:", error);
          
          // Extract error message with proper type checking
          let errorMessage = "Invalid or expired code. Please try again.";
          
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (error && typeof error === 'object' && 'message' in error) {
            const err = error as { message: unknown };
            if (typeof err.message === 'string') {
              errorMessage = err.message;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          }

          // Show error toast
          toast({
            title: "Verification Failed",
            description: errorMessage,
            variant: "error",
            duration: 5000,
          });

          // Also show error in form
          otpForm.setError("otp", {
            type: "manual",
            message: errorMessage,
          });
        },
      }
    );
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resendOtpMutation.isPending) return;

    resendOtpMutation.mutate(email, {
      onSuccess: () => {
        setCountdown(30); // Reset countdown
        otpForm.clearErrors();
      },
      onError: (error: unknown) => {
        console.error("Failed to resend OTP:", error);
        const errorMessage = extractErrorMessage(
          error,
          "Failed to resend verification code. Please try again."
        );
        toast({
          title: "Failed to Resend Code",
          description: errorMessage,
          variant: "error",
          duration: 5000,
        });
      },
    });
  };

  const handleBackToEmail = () => {
    setStep("email");
    setCountdown(0);
    otpForm.reset();
  };

  return (
    <section className="flex flex-col min-h-screen md:flex-row overflow-hidden">
      {/* Left side - Brand (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 md:min-h-screen md:bg-[#f8f6f9] md:items-center md:justify-center">
        <div className="flex flex-col mx-6 z-10 md:mx-auto md:max-w-md md:w-full">
          <BrandTitle
            description="Sponsor meals from any restaurant in the world."
            className="text-center mb-12 mt-16 md:mt-0 flex flex-col items-center justify-center"
            titleClassName="text-6xl font-bold font-inter mx-auto text-primary"
            descriptionClassName="text-lg text-black font-mf"
            brandImg={true}
          />
        </div>
      </div>

      {/* Right side - Form */}
      <div className="mt-12 mx-6 flex-col flex md:mt-0 md:mx-auto md:w-1/2 md:max-w-md md:px-8 md:justify-center">
        {step === "email" ? (
          // Email Step
          <>
            <h2 className="text-2xl font-bold text-[#FF7A00] mb-8 text-center md:text-left font-inter">
              Forgot Password
            </h2>
            <p className="text-gray-600 mb-6 text-center md:text-left">
              Enter your email address to receive a verification code.
            </p>

            {/* Error display */}
            {emailForm.formState.errors.root && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">
                  {emailForm.formState.errors.root.message}
                </p>
              </div>
            )}

            <form
              onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
              className="md:w-full"
            >
              <FormField
                name="email"
                type="email"
                register={emailForm.register}
                errors={emailForm.formState.errors}
                placeholder="Email Address"
                inputClassName="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] w-full"
              />

              <Button
                type="submit"
                disabled={
                  forgotPasswordMutation.isPending ||
                  !emailForm.formState.isValid
                }
                className="bg-[#FF7A00] h-14 rounded-lg flex items-center justify-center mt-6 w-full hover:bg-[#FF7A00]/90 transition-colors disabled:opacity-50"
              >
                {forgotPasswordMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
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
                    Sending...
                  </div>
                ) : (
                  <span className="text-center text-white font-medium text-lg">
                    Send Verification Code
                  </span>
                )}
              </Button>
              <div className="text-center mt-4">
                <Link
                  to="/login"
                  className="text-[#FF7A00] font-medium hover:text-[#FF7A00]/90 hover:underline"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </>
        ) : (
          // OTP Step
          <>
            <button
              type="button"
              onClick={handleBackToEmail}
              className="text-[#FF7A00] hover:text-[#FF7A00]/90 mb-4 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <h2 className="text-2xl font-bold text-[#FF7A00] mb-4 text-center md:text-left font-inter">
              Verify Code
            </h2>
            <p className="text-gray-600 mb-6 text-center md:text-left">
              We've sent a 6-digit code to{" "}
              <span className="font-medium text-[#FF7A00]">{email}</span>
            </p>

            <form
              onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
              className="md:w-full"
            >
              <div className="mb-6">
                <OtpInput
                  value={otpForm.watch("otp") || ""}
                  onChange={(value) => {
                    otpForm.setValue("otp", value);
                    otpForm.trigger("otp");
                    // Clear errors when user types
                    if (otpForm.formState.errors.otp) {
                      otpForm.clearErrors("otp");
                    }
                  }}
                  numberOfInputs={6}
                  hasError={!!otpForm.formState.errors.otp}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-red-500 text-sm mt-2">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resendOtpMutation.isPending}
                  className={`text-sm font-medium flex items-center gap-1 ${
                    countdown > 0 || resendOtpMutation.isPending
                      ? "text-gray-400"
                      : "text-[#FF7A00] hover:text-[#FF7A00]/90"
                  }`}
                >
                  {resendOtpMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      {countdown > 0
                        ? `Resend in ${countdown}s`
                        : "Resend code"}
                    </>
                  )}
                </button>
              </div>

              <Button
                type="submit"
                disabled={
                  verifyOtpMutation.isPending || !otpForm.formState.isValid
                }
                className="bg-[#FF7A00] h-14 rounded-lg flex items-center justify-center w-full hover:bg-[#FF7A00]/90 transition-colors disabled:opacity-50"
              >
                {verifyOtpMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
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
                    Verifying...
                  </div>
                ) : (
                  <span className="text-center text-white font-medium text-lg">
                    Verify and Continue
                  </span>
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
};

export default ForgetPassword;