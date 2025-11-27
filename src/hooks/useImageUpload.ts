/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation } from "@tanstack/react-query";
import { fileService, type ImageUploadResponse } from "@/services/fileService";
// import { useToast } from "@/hooks/useToast";

export interface UseImageUploadOptions {
  onSuccess?: (data: ImageUploadResponse) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export const useImageUpload = (options: UseImageUploadOptions = {}) => {
  // const { toast } = useToast();
  const {
    onSuccess,
    onError,
    //  showToast = false
  } = options;

  const mutation = useMutation({
    mutationFn: ({
      file,
      additionalData,
    }: {
      file: File;
      additionalData?: Record<string, any>;
    }) => fileService.uploadImage(file, additionalData),
    onSuccess: (data) => {
      // if (showToast) {
      //   toast({
      //     title: "Upload successful",
      //     description: "Your image has been uploaded successfully.",
      //     variant: "success",
      //   });
      // }
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      // if (showToast) {
      //   toast({
      //     title: "Upload failed",
      //     description:
      //       error.message || "Failed to upload image. Please try again.",
      //     variant: "error",
      //   });
      // }
      onError?.(error);
    },
  });

  return {
    uploadImage: mutation.mutate,
    uploadImageAsync: mutation.mutateAsync,
    isUploading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
};

export const useImageValidation = () => {
  const validateFile = (file: File) => {
    return fileService.validateImageFile(file);
  };

  const formatFileSize = (bytes: number) => {
    return fileService.formatFileSize(bytes);
  };

  return {
    validateFile,
    formatFileSize,
  };
};
