import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";
import Button from "@/components/Button";

interface RestaurantConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReplace: () => void;
  onCancel: () => void;
  currentRestaurantName?: string;
  newRestaurantName?: string;
  newItemName: string;
}

const RestaurantConflictDialog: React.FC<RestaurantConflictDialogProps> = ({
  isOpen,
  onClose,
  onReplace,
  onCancel,
  currentRestaurantName = "another restaurant",
  newRestaurantName = "this restaurant",
  newItemName,
}) => {
  const handleReplace = () => {
    onReplace();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-orange-200 bg-orange-50 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
          {/* Close button */}
          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4 text-orange-600" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {/* Content */}
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5 flex-shrink-0" />

            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-lg font-semibold text-orange-800 mb-2">
                Replace Cart Items?
              </Dialog.Title>

              <Dialog.Description className="text-sm text-orange-700 mb-4">
                You have items from <strong>{currentRestaurantName}</strong> in
                your cart. Adding <strong>{newItemName}</strong> from{" "}
                <strong>{newRestaurantName}</strong> will replace your current
                cart. You can only order from one restaurant at a time.
              </Dialog.Description>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleReplace}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Replace Cart
                </Button>

                <Button
                  onClick={handleCancel}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium bg-transparent border border-orange-600 text-orange-600 rounded-md hover:bg-orange-50 transition-colors"
                >
                  Keep Current Cart
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RestaurantConflictDialog;
