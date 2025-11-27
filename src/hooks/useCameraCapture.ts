/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback, useEffect } from "react";

interface UseCameraCaptureOptions {
  onCapture?: (file: File) => void;
  onError?: (error: Error) => void;
}

export function useCameraCapture(options?: UseCameraCaptureOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
        options?.onError?.(new Error("Camera not supported."));
        setHasPermission(false);
        return false;
      }

      stopCamera();
      setIsLoading(true);
      setHasPermission(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
        });
        setStream(mediaStream);
        setHasPermission(true);
        return true;
      } catch (error: any) {
        console.error("Failed to start camera:", error);
        setHasPermission(false);
        options?.onError?.(
          new Error(
            "Camera permission denied. Please enable it in your browser settings."
          )
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [options, stopCamera]
  );

  const openModal = useCallback(() => {
    setIsOpen(true);
    startCamera(facingMode);
  }, [startCamera, facingMode]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    stopCamera();
  }, [stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (video.videoWidth === 0 || !context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          options?.onCapture?.(file);
          closeModal();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [stream, options, closeModal]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => {
      const newMode = prev === "user" ? "environment" : "user";
      startCamera(newMode);
      return newMode;
    });
  }, [startCamera]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
    }
  }, [stream]);

  return {
    isOpen,
    openModal,
    closeModal,
    hasPermission,
    videoRef,
    canvasRef,
    capturePhoto,
    switchCamera,
    isLoading,
    stream,
  };
}
