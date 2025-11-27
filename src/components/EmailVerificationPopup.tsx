import React from "react";
import { AlertCircle, Mail, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { useResendVerificationMutation } from "@/features/auth/hooks/authQueries";
import { useToast } from "@/hooks/useToast";
import { useEmailVerificationPopup } from "@/hooks/useEmailVerificationPopup";
import Button from "./Button";

interface EmailVerificationPopupProps {
  /** Delay in milliseconds before showing the popup (default: 2 minutes) */
  delayMs?: number;
}

const EmailVerificationPopup: React.FC<EmailVerificationPopupProps> = ({
  delayMs = 2 * 60 * 1000, // 2 minutes default
}) => {
  const { isOpen, closePopup, dismissPopup, user, shouldShow } =
    useEmailVerificationPopup({
      delayMs,
    });
  const { toast } = useToast();
  const navigate = useNavigate();

  const resendVerificationMutation = useResendVerificationMutation();

  // Don't render if user is verified, not authenticated, or popup should not show
  if (!user || user.isVerified || !shouldShow) {
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
        closePopup();
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
  const handleEnterCode = () => {
    closePopup();
    navigate("/auth/email-verification");
  };

  const handleDismiss = () => {
    dismissPopup();
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={closePopup}>
      <Dialog.Portal>
        <Dialog.Content className="fixed bottom-4 right-4 z-50 w-full max-w-sm border border-amber-200 bg-amber-50 p-4 shadow-lg rounded-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right">
          {/* Close button */}
          <Dialog.Close className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4 text-amber-600" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
          {/* Content */}
          <div className="flex items-start space-x-3 pr-6">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-sm font-semibold text-amber-800 mb-1">
                Email Verification Required
              </Dialog.Title>

              <Dialog.Description className="text-xs text-amber-700 mb-3">
                Please verify your email address ({user.email}) to access all
                features.
              </Dialog.Description>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleResendEmail}
                  disabled={resendVerificationMutation.isPending}
                  className="flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  {resendVerificationMutation.isPending
                    ? "Sending..."
                    : "Send Code"}
                </Button>

                <Button
                  onClick={handleEnterCode}
                  className="flex items-center justify-center px-3 py-1.5 text-xs font-medium bg-transparent border border-amber-600 text-amber-600 rounded-md hover:bg-amber-50 transition-colors"
                >
                  Enter Code
                </Button>
              </div>

              <div className="mt-3 pt-2 border-t border-amber-200">
                <button
                  onClick={handleDismiss}
                  className="text-xs text-amber-600 hover:text-amber-800 underline hover:no-underline transition-colors"
                >
                  Remind me later
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EmailVerificationPopup;
