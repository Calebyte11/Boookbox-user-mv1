import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import FormField from "@/components/FormField";
import LockImage from "@/assets/images/lock.png";
import { useResetPasswordMutation } from "@/features/auth/hooks/authQueries";
import BrandTitle from "@/components/BrandTitle";

// Validation schema
const passwordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])/,
      "Password must contain at least one uppercase, one lowercase, one number and one special character"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
});

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}
interface PasswordRequirementProps {
  text: string;
  isMet: boolean;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({
  text,
  isMet,
}) => (
  <li className="flex items-center justify-between space-x-2">
    <p className={`text-sm ${isMet ? "text-primary" : "text-gray-500"}`}>
      {text}
    </p>
    {isMet && (
      <span className="w-4 h-4 rounded border-2 border-primary bg-primary flex items-center justify-center">
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </span>
    )}
  </li>
);
const CreateNewPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSuccess, setShowSuccess] = useState(false);
  // Get email from navigation state
  const { email, data:{token} } = location.state || {};
  // Initialize the reset password mutation
  const resetPasswordMutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setError,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    mode: "onChange",
  }); // Redirect if email is not available
  useEffect(() => {
    if (!email) {
      navigate("/auth/forget-password", {
        state: {
          error:
            "Invalid reset session. Please restart the password reset process.",
        },
      });
    }
  }, [email, navigate]);
  const onSubmit = async (data: PasswordFormData) => {
    console.log(
      email,
      data.newPassword,
      token
    )

    if (!email) {
      setError("root", {
        type: "manual",
        message:
          "Invalid reset session. Please restart the password reset process.",
      });
      return;
    }

    try {
      
      await resetPasswordMutation.mutateAsync({
        email,
        newPassword: data.newPassword,
        token
      });

      // Show success screen
      setShowSuccess(true);

      // Redirect to sign in after showing success message
      setTimeout(() => {
        navigate("/auth/login", {
          state: {
            message:
              "Password updated successfully! Please sign in with your new password.",
          },
        });
      }, 8000);
    } catch (error: unknown) {
      console.error("Failed to update password:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update password. Please try again.";
      setError("root", {
        type: "manual",
        message: errorMessage,
      });
      reset();
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6">
              <img
                src={LockImage}
                alt="Success"
                className="w-1/2 mx-auto mb-4"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Password Updated Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              You have successfully changed your password. You will be
              redirected to the sign in page shortly.
            </p>
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-5 w-5 text-primary"
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
              <span className="ml-2 text-sm text-gray-500">Redirecting...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="flex flex-col min-h-screen md:flex-row overflow-hidden">
      {/* Left side - Brand (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 md:min-h-screen md:bg-[#f8f6f9] md:items-center md:justify-center">
        <div className="flex flex-col mx-6 z-10 md:mx-auto md:max-w-md md:w-full">
          <div className="flex flex-col text-center items-center justify-center start-center w-full">
            <BrandTitle
              description="Sponsor meals from any restaurant in the world."
              className="text-center mb-12 mt-[4rem] md:mt-0 flex flex-col items-center justify-center"
              titleClassName="text-6xl font-bold font-inter mx-auto text-primary"
              descriptionClassName="text-lg text-black font-mf"
              brandImg={true}
            />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="mt-12 mx-6 flex-col flex md:mt-0 md:mx-auto md:w-1/2 md:max-w-md md:px-8 md:justify-center">
        {" "}
        <div className="mb-6">
          <Link
            to="/login"
            className="flex items-center text-[#FF7A00] hover:text-[#FF7A00]/90 transition-colors"
          >
            <ArrowLeft size={18} className="mr-1" />
            Back to Sign In
          </Link>
        </div>
        <div className="text-center md:text-left mb-8">
          <h2 className="text-2xl font-bold text-[#FF7A00] mb-2 font-inter">
            Create New Password
          </h2>
          <p className="text-gray-600">
            Your new password must be different from previously used passwords.
          </p>
        </div>{" "}
        {/* {( resetPasswordMutation.error) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {errors.root?.message ||
                (resetPasswordMutation.error instanceof Error
                  ? resetPasswordMutation.error.message
                  : "An unexpected error occurred")}
            </p>
          </div>
        )} */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:w-full">
          <FormField
          show={true}
            name="newPassword"
            type="password"
            register={register}
            errors={errors}
            placeholder="Enter new password"
            inputClassName="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] w-full"
          />

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <ul className="space-y-2">
              <PasswordRequirement
                text="At least 8 characters"
                isMet={watch("newPassword")?.length >= 8}
              />
              <PasswordRequirement
                text="At least one lowercase letter"
                isMet={/[a-z]/.test(watch("newPassword") || "")}
              />
              <PasswordRequirement
                text="At least one uppercase letter"
                isMet={/[A-Z]/.test(watch("newPassword") || "")}
              />
              <PasswordRequirement
                text="At least one number"
                isMet={/[0-9]/.test(watch("newPassword") || "")}
              />
              <PasswordRequirement
                text="At least one special character"
                isMet={/[^a-zA-Z0-9]/.test(watch("newPassword") || "")}
              />
            </ul>
          </div>

          <FormField
            name="confirmPassword"
            type="password"
            register={register}
            errors={errors}
            placeholder="Confirm new password"
            inputClassName="p-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF7A00] focus:border-[#FF7A00] w-full"
          />

          <Button
            type="submit"
            disabled={resetPasswordMutation.isPending || !isValid}
            className={`w-full h-14 rounded-lg ${
              isValid
                ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                : "bg-[#FF7A00]/50 text-white cursor-not-allowed"
            } transition-colors disabled:opacity-50`}
          >
            {resetPasswordMutation.isPending ? (
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
                Updating Password...
              </div>
            ) : (
              <span className="text-center text-white font-medium text-lg">
                Update Password
              </span>
            )}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default CreateNewPassword;
