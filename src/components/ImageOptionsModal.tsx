import React, { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Upload, X } from "lucide-react";

interface ImageOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCameraSelect: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

const ImageOptionsModal: React.FC<ImageOptionsModalProps> = ({
  isOpen,
  onClose,
  // onCameraSelect,
  onFileSelect,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-lg shadow-xl z-[101] m-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Update Profile Photo
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <div className="space-y-3">
              {/* <button
                onClick={onCameraSelect}
                disabled={isUploading}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-blue-100 rounded-full p-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Take Photo</h3>
                  <p className="text-sm text-gray-600">
                    Use your camera to take a new photo
                  </p>
                </div>
              </button> */}

              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="w-full flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-green-100 rounded-full p-2">
                  <Upload className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Upload Image</h3>
                  <p className="text-sm text-gray-600">
                    Choose from your device
                  </p>
                  <span className="block text-xs text-gray-400 mt-1">
                    Best size: 400×400px (square), less than 5MB
                  </span>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onFileSelect}
                className="hidden"
              />
            </div>

            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                Uploading...
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImageOptionsModal;
