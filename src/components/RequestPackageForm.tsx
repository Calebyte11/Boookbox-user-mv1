import React, { useState } from 'react';
import { X, Gift, Minus, Plus, Loader2} from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';
import { useCreateGiftRequest } from '@/hooks/useCreateGiftRequest';
import RequestPackageModal from "@/components/RequestPackageModal";

interface PackageData {
  id: string;
  brand: string;
  businessCategory: string;
  description: string;
  image: string;
  package: string;
  price?: number;
  restaurantId: string;
  menuId: string;
  currency: string;
  category: string;
}

interface RequestPackageFormProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: PackageData;
  onSuccess: (shareableLink: string) => void;
}

const RequestPackageForm: React.FC<RequestPackageFormProps> = ({
  isOpen,
  onClose,
  packageData,
  onSuccess,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [message, setmessage] = useState('');
  const [shareableLink, setShareableLink] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const { mutate: createGiftRequest, isPending } = useCreateGiftRequest();
  console.log(packageData);
  
  if (!isOpen && !showSuccessModal) return null;

  const price = packageData.price || 0;
  const totalAmount = quantity * price;

  const handleQuantityChange = (value: number) => {
    if (value >= 1 && value <= 99) {
      setQuantity(value);
    }
  };

  const handleIncrement = () => {
    if (quantity < 99) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const requestData = {
      productId: packageData.menuId,
      businessId: packageData.restaurantId,
      quantity,
      totalAmount,
      message: message.trim() || "Hey! kindly want you to help get this package for me using the link below",
    };
    console.log(requestData);
    
    createGiftRequest(requestData, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onSuccess: (data: any) => {
        console.log(data);
        // Store the shareable link from fullText
        setShareableLink(data.fullText);
        // Show the success modal
        setShowSuccessModal(true);
        // Pass the shareable link to parent component
        onSuccess(data.fullText);
      },
      onError: (error) => {
        console.error('Failed to create gift request:', error);
        alert('Failed to create gift request. Please try again.');
      },
    });
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Also close the main form
    onClose();
    // Reset form state
    setQuantity(1);
    setmessage('');
    setShareableLink('');
  };

  // Conditional rendering: Show success modal OR form content
  if (showSuccessModal) {
    return (
      <RequestPackageModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        packageData={packageData}
        shareableLink={shareableLink}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-[#000000b7] bg-opacity-50 flex items-center justify-center z-50 pt-2 pb-2 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isPending}
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-orange-100 rounded-full p-4 mb-4">
            <Gift size={32} className="text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Request Package
          </h2>
          <p className="text-gray-600">
            Customize your request and get a shareable link
          </p>
        </div>

        {/* Package Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <img
              src={packageData.image}
              alt={packageData.package}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 capitalize">
                {packageData.package}
              </h3>
              <p className="text-sm text-gray-500">{packageData.brand}</p>
              {packageData.price && (
                <p className="text-orange-500 font-bold">
                  {formatCurrency(packageData.price, packageData.currency || "NGN")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-lg p-3">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1 || isPending}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} className="text-gray-600" />
              </button>
              
              <input
                type="number"
                min="1"
                max="99"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                disabled={isPending}
                className="w-16 text-center text-lg font-semibold bg-transparent border-none focus:outline-none"
              />
              
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= 99 || isPending}
                className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Total Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Price
            </label>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalAmount, packageData.currency || "NGN")}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {quantity} × {formatCurrency(price, packageData.currency || "NGN")}
              </p>
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customize Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setmessage(e.target.value)}
              placeholder="Hey! kindly want you to help get this package for me using the link below"
              disabled={isPending}
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 resize-none transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {message.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Creating Request...
              </>
            ) : (
              <>
                <Gift size={20} />
                Get Request Link
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> After creating your request, you'll get a 
            shareable link to send to your friends. They can view your customized message 
            and gift this package to you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestPackageForm;