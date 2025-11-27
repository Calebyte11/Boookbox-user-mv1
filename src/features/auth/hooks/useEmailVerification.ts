import { useMutation } from "@tanstack/react-query";
import { useSendVerfCodeToEmail, useVerifyEmail } from "@/hooks/useUserQueries";
import { useToast } from "@/hooks/useToast";
import useAuthStore from "@/store/authStore";
import type { VerifyEmailBody, EmailBody } from "@/services/usersService";

/**
 * Hook for sending email verification code
 */
export const useResendVerificationMutation = () => {
  const { toast } = useToast();
  const sendCodeMutation = useSendVerfCodeToEmail();

  return useMutation({
    mutationFn: async (email: string) => {
      const body: EmailBody = { email };
      return sendCodeMutation.mutateAsync(body);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the verification code.",
          variant: "success",
        });
      } else {
        throw new Error(data.message || "Failed to send verification code");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Code",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "error",
      });
    },
  });
};

/**
 * Hook for verifying email with code
 */
export const useEmailVerificationMutation = () => {
  const { toast } = useToast();
  // const { user, login } = useAuthStore();
  const verifyEmailMutation = useVerifyEmail();

  return useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string;}) => {
      const body: VerifyEmailBody = { email, code };
      return verifyEmailMutation.mutateAsync(body);
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description:
          error instanceof Error
            ? error.message
            : "Invalid verification code. Please try again.",
        variant: "error",
      });
    },
  });
};

/**
 * Combined hook for email verification workflow
 */
export const useEmailVerificationWorkflow = () => {
  const resendCode = useResendVerificationMutation();
  const verifyEmail = useEmailVerificationMutation();
  const { user } = useAuthStore();

  const sendVerificationCode = async (email?: string) => {
    const emailToUse = email || user?.email;
    if (!emailToUse) {
      throw new Error("Email address is required");
    }
    return resendCode.mutateAsync(emailToUse);
  };

  const verifyEmailCode = async (code: string, email?: string,) => {
    const emailToUse = email || user?.email;
    if (!emailToUse) {
      throw new Error("Email address is required");
    }
    // const tokenToUse = token ?? "";
    return verifyEmail.mutateAsync({ email: emailToUse, code });
  };

  return {
    sendVerificationCode,
    verifyEmailCode,
    isLoading: resendCode.isPending || verifyEmail.isPending,
    isSendingCode: resendCode.isPending,
    isVerifying: verifyEmail.isPending,
    user,
  };
};
