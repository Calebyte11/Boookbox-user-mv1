import React, { useState, useEffect } from "react";
import { Camera, Upload, X, RotateCcw, CheckCircle } from "lucide-react";
import Button from "@/components/Button";
import { useCameraCapture } from "@/hooks/useCameraCapture";
import { useToast } from "@/hooks/useToast";

interface ImageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (file: File) => void;
  title?: string;
}

const ImageSelectionModal: React.FC<ImageSelectionModalProps> = ({
  isOpen,
  onClose,
  onImageSelect,
  title = "Select Profile Image",
}) => {
  const [selectedMethod, setSelectedMethod] = useState<
    "upload" | "camera" | null
  >(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const [isCameraSupported, setIsCameraSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
      setIsCameraSupported(false);
    }
  }, []);

  const {
    isOpen: isCameraOpen,
    hasPermission,
    videoRef,
    canvasRef,
    openModal,
    closeModal,
    capturePhoto,
    switchCamera,
  } = useCameraCapture({
    onCapture: (file) => {
      setCapturedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreview(true);
    },
    onError: (error) => {
      console.error("Camera error:", error);
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
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid image file",
          variant: "error",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          variant: "error",
        });
        return;
      }

      setCapturedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setShowPreview(true);
    }
  };

  const handleStartCamera = () => {
    setSelectedMethod("camera");
    openModal();
  };

  const handleConfirmImage = () => {
    if (capturedFile) {
      onImageSelect(capturedFile);
      handleClose();
    }
  };

  const handleRetake = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedFile(null);
    setShowPreview(false);

    if (selectedMethod === "camera") {
      return;
    }

    setSelectedMethod(null);
  };

  const handleClose = () => {
    closeModal();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setCapturedFile(null);
    setShowPreview(false);
    setSelectedMethod(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <Button
            className="p-2 hover:bg-gray-100 rounded-lg"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!selectedMethod && !showPreview && (
            // Method selection
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Choose how you want to add your profile image
              </p>

              {/* Upload from device */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary transition-colors">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">
                        Upload from device
                      </p>
                      <p className="text-sm text-gray-500">
                        Browse your photos
                      </p>
                    </div>
                  </div>
                </div>
              </label>

              {/* Take photo with camera */}
              {isCameraSupported && (
                <Button
                  className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary transition-colors"
                  onClick={handleStartCamera}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">Take a photo</p>
                      <p className="text-sm text-gray-500">Use your camera</p>
                    </div>
                  </div>
                </Button>
              )}

              {!isCameraSupported && (
                <div className="border-2 border-gray-200 rounded-xl p-6 opacity-50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-400">
                        Camera not available
                      </p>
                      <p className="text-sm text-gray-400">
                        Not supported in this browser
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedMethod === "camera" && !showPreview && (
            // Camera view
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full aspect-square object-cover"
                  style={{ transform: "scaleX(-1)" }}
                />

                {hasPermission === false && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center text-white p-4">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="mb-2">Camera permission required</p>
                      <p className="text-sm opacity-75">
                        Please allow camera access in your browser settings
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isCameraOpen && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
                    onClick={switchCamera}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>

                  <Button
                    className="w-16 h-16 bg-primary rounded-full hover:bg-primary-dark text-white"
                    onClick={capturePhoto}
                  >
                    <Camera className="w-8 h-8" />
                  </Button>

                  <Button
                    className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
                    onClick={() => {
                      closeModal();
                      setSelectedMethod(null);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {showPreview && previewUrl && (
            // Image preview
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full aspect-square object-cover rounded-xl"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 p-3 border border-gray-300 rounded-xl hover:bg-gray-50"
                  onClick={handleRetake}
                >
                  Retake
                </Button>
                <Button
                  className="flex-1 p-3 bg-primary text-white rounded-xl hover:bg-primary-dark flex items-center justify-center gap-2"
                  onClick={handleConfirmImage}
                >
                  <CheckCircle className="w-5 h-5" />
                  Use Photo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImageSelectionModal;
