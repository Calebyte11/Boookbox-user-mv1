import React from "react";
import { AlertCircle, Mail, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import { useResendVerificationMutation } from "@/features/auth/hooks/authQueries";
import { useToast } from "@/hooks/useToast";
import Button from "./Button";

interface EmailVerificationBannerProps {
  className?: string;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  className = "",
  onDismiss,
  showDismiss = true,
}) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const resendVerificationMutation = useResendVerificationMutation();

  // Don't show banner if:
  // 1. User is not authenticated
  // 2. Email is already verified
  if (!user || user.isVerified) {
    return null;
  }
  const handleResendEmail = async () => {
    if (!user.email) {
      toast({
        title: "Error",
        description: "No email address found",
        variant: "error",
      });
      return;
    }

    try {
      const response = await resendVerificationMutation.mutateAsync(user.email);
      if (response.success) {
        // Navigate to email verification page after successfully sending code
        navigate("/auth/email-verification");
      } else {
        throw new Error(
          response.message || "Failed to send verification email"
        );
      }
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "error",
      });
    }
  };
  return (
    <div
      className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-800">
            Email Verification Required
          </h4>{" "}
          <p className="mt-1 text-sm text-amber-700 w-lg">
            Please verify your email address ({user.email}) to access all
            restaurant features.{" "}
          </p>
          <div className="mt-3 flex items-center space-x-3">
            <Button
              onClick={handleResendEmail}
              disabled={resendVerificationMutation.isPending}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              <Mail className="h-3 w-3 mr-1" />
              {resendVerificationMutation.isPending
                ? "Sending..."
                : "Send Verification Code"}
            </Button>

            <Button
              onClick={() => navigate("/auth/email-verification")}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-transparent border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50"
            >
              Enter Code
            </Button>
          </div>
        </div>

        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
