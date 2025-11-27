import { useMutation } from "@tanstack/react-query";
import {
  useSendPasswordResetCode,
  useVerifyPasswordResetCode,
  useResetPassword,
} from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import type {
  PasswordResetSendCodeBody,
  PasswordResetVerifyCodeBody,
  PasswordResetBody,
} from "@/services/usersService";

/**
 * Hook for sending password reset code to email
 */
export const useForgotPasswordMutation = () => {
  const { toast } = useToast();
  const sendCodeMutation = useSendPasswordResetCode();

  return useMutation({
    mutationFn: async (email: string) => {
      const body: PasswordResetSendCodeBody = { email };
      return sendCodeMutation.mutateAsync(body);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Reset Code Sent",
          description: "Please check your email for the password reset code.",
          variant: "success",
        });
      } else {
        throw new Error(data.message || "Failed to send password reset code");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Reset Code",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "error",
      });
    },
  });
};

/**
 * Hook for verifying password reset code (OTP)
 * FIXED: Removed duplicate toast - component handles success message
 * FIXED: Better error handling to let component extract error details
 */
export const useVerifyOtpMutation = () => {
  const verifyCodeMutation = useVerifyPasswordResetCode();

  return useMutation({
    mutationFn: async ({ email, otp }: { email: string; otp: string }) => {
      // Backend expects 'code' parameter, not 'otp'
      const body: PasswordResetVerifyCodeBody = { email, code: otp };
      console.log("📤 Sending OTP verification:", { email, code: otp });
      
      const response = await verifyCodeMutation.mutateAsync(body);
      console.log("📥 OTP verification response:", response);
      
      // Return the full response so component can access token/data
      return response;
    },
    onError: (error) => {
      // Don't show toast here - let the component handle it for better control
      console.error("❌ OTP verification error:", error);
      // Re-throw to let component handle
      throw error;
    },
  });
};

/**
 * Hook for resending password reset code
 */
export const useResendOtpMutation = () => {
  const { toast } = useToast();
  const sendCodeMutation = useSendPasswordResetCode();

  return useMutation({
    mutationFn: async (email: string) => {
      const body: PasswordResetSendCodeBody = { email };
      return sendCodeMutation.mutateAsync(body);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Code Resent",
          description: "A new reset code has been sent to your email.",
          variant: "success",
        });
      } else {
        throw new Error(data.message || "Failed to resend reset code");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Resend Code",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "error",
      });
    },
  });
};

/**
 * Hook for resetting password with new password
 */
export const useResetPasswordMutation = () => {
  const { toast } = useToast();
  const resetPasswordMutation = useResetPassword();

  return useMutation({
    mutationFn: async ({
      email,
      newPassword,
      token
    }: {
      email: string;
      newPassword: string;
      token: string;
    }) => {
      const body: PasswordResetBody = { email, newPassword, token };
      return resetPasswordMutation.mutateAsync(body);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Password Reset Successfully",
          description: "Your password has been updated successfully.",
          variant: "success",
        });
      } else {
        throw new Error(data.message || "Failed to reset password");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Reset Password",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "error",
      });
    },
  });
};

/**
 * Combined hook for the entire forgot password workflow
 */
export const useForgotPasswordWorkflow = () => {
  const sendCode = useForgotPasswordMutation();
  const verifyCode = useVerifyOtpMutation();
  const resendCode = useResendOtpMutation();
  const resetPassword = useResetPasswordMutation();

  return {
    sendCode,
    verifyCode,
    resendCode,
    resetPassword,

    // Convenience properties
    isLoading:
      sendCode.isPending ||
      verifyCode.isPending ||
      resendCode.isPending ||
      resetPassword.isPending,

    error:
      sendCode.error ||
      verifyCode.error ||
      resendCode.error ||
      resetPassword.error,
  };
};