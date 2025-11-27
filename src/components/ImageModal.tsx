import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ZoomIn, ZoomOut } from "lucide-react";

interface ImageModalProps {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ src, alt, isOpen, onClose }) => {
  const [isZoomed, setIsZoomed] = React.useState(false);

  // Reset zoom when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsZoomed(false);
    }
  }, [isOpen]);

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/80 z-50 animate-in fade-in-0 cursor-pointer" 
          onClick={onClose}
        />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div 
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Close image"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>

            {/* Zoom toggle button */}
            <button
              onClick={handleImageClick}
              className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? (
                <ZoomOut className="w-5 h-5" />
              ) : (
                <ZoomIn className="w-5 h-5" />
              )}
            </button>

            {/* Image container */}
            <div 
              className={`relative transition-transform duration-200 ${
                isZoomed ? 'scale-150 cursor-zoom-out overflow-auto max-w-[90vw] max-h-[90vh]' : 'cursor-zoom-in'
              }`}
              onClick={handleImageClick}
            >
              <img
                src={src}
                alt={alt}
                className={`object-contain rounded-lg shadow-2xl ${
                  isZoomed ? 'w-auto h-auto' : 'max-w-[90vw] max-h-[90vh]'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/api/placeholder/400/300";
                }}
              />
            </div>

            {/* Image info overlay */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              Click to {isZoomed ? 'zoom out' : 'zoom in'}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImageModal;