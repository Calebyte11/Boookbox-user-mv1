import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/useToast";
import { useCameraCapture } from "@/hooks/useCameraCapture";
import { uploadImage, updateProfileImage } from "@/services/imageUploadService";
import useAuthStore from "@/store/authStore";
import type { ProfileResponse } from "@/services/profileService";

interface UseProfileImageUploadOptions {
  onSuccess?: (data: ProfileResponse) => void;
  onError?: (error: Error) => void;
}

export function useProfileImageUpload(options?: UseProfileImageUploadOptions) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadResponse = await uploadImage(file);
      const profileResponse = await updateProfileImage(
        uploadResponse.url || ""
      );
      const { updateUser } = useAuthStore.getState();
      updateUser({
        profileImage: uploadResponse.url,
        photoURL: uploadResponse.url,
      });
      return { ...profileResponse, imageUrl: uploadResponse.url };
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(data.imageUrl);
      }
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile image has been updated successfully!",
        variant: "success",
      });
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description:
          error.message ||
          "Please ensure your image is less than 5MB and at least 400x400px.",
        variant: "error",
      });
      options?.onError?.(error);
    },
  });

  const handleImageSelect = useCallback(
    (file: File) => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowImageOptions(false);
      mutation.mutate(file);
    },
    [previewUrl, mutation]
  );

  const cameraCapture = useCameraCapture({
    onCapture: handleImageSelect,
    onError: (error: Error) => {
      toast({
        title: "Camera Error",
        description: error.message,
        variant: "error",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const openImageOptions = () => setShowImageOptions(true);
  const closeImageOptions = () => setShowImageOptions(false);

  const openCamera = () => {
    setShowImageOptions(false);
    cameraCapture.openModal();
  };

  const updatePreviewUrl = (url: string | null) => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(url);
  };

  return {
    isUploading: mutation.isPending,
    error: mutation.error,
    previewUrl,
    showImageOptions,
    openImageOptions,
    closeImageOptions,
    handleFileSelect,
    openCamera,
    cameraCapture,
    updatePreviewUrl,
  };
}
