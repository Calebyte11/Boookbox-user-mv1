import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, RotateCcw, X, Loader2, VideoOff } from "lucide-react";
import Button from "./Button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: () => void;
  onSwitchCamera: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  hasPermission?: boolean | null;
  isLoading?: boolean;
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  onSwitchCamera,
  videoRef,
  canvasRef,
  hasPermission,
  isLoading,
}) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="text-lg">Starting camera...</p>
        </div>
      );
    }

    if (hasPermission === false) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 text-white p-6 text-center">
          <VideoOff className="w-12 h-12 mb-4 text-red-500" />
          <h3 className="text-xl font-semibold mb-2">Camera Access Denied</h3>
          <p className="text-gray-300">
            Please grant camera permission in your browser settings to use this
            feature.
          </p>
        </div>
      );
    }

    return (
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
      />
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[100]" />
        <Dialog.Content
          className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full h-full md:max-w-2xl md:max-h-[80vh] bg-black flex flex-col justify-center items-center shadow-2xl z-[101] overflow-hidden md:rounded-lg"
          onEscapeKeyDown={onClose}
        >
          <VisuallyHidden>
            <Dialog.Title>Take a Profile Photo</Dialog.Title>
            <Dialog.Description>
              Use your device's camera to capture a new profile picture.
            </Dialog.Description>
          </VisuallyHidden>

          <div className="relative w-full h-full flex items-center justify-center">
            {renderContent()}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="absolute top-4 right-4">
            <Button
              onClick={onClose}
              className="bg-black/50 text-white rounded-full p-2 hover:bg-black/75 transition-colors"
              aria-label="Close camera"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent flex justify-center items-center gap-8">
            <Button
              onClick={onSwitchCamera}
              className="bg-white/20 text-white rounded-full p-4 hover:bg-white/30 transition-colors"
              aria-label="Switch camera"
              disabled={isLoading || hasPermission === false}
            >
              <RotateCcw className="w-7 h-7" />
            </Button>
            <Button
              onClick={onCapture}
              className="w-20 h-20 rounded-full bg-white border-4 border-white/50 ring-4 ring-primary ring-offset-4 ring-offset-transparent flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              aria-label="Capture photo"
              disabled={isLoading || hasPermission === false}
            >
              <Camera className="w-9 h-9 text-primary" />
            </Button>
            <div className="w-16 h-16" />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CameraModal;
