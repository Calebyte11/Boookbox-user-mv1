import React, { useState } from 'react';
import {
   Copy,
    X, 
    Check,
    //  Gift 
    } from 'lucide-react';
import { shareToWhatsApp, shareToFacebook, shareToSMS } from '@/utils/socialShare';
import { formatCurrency } from '@/utils/formatCurrency';

// Define the Package interface to match your PackageItem
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  category: any;
}

interface RequestPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: PackageData;
  shareableLink: string; // Now receives the link from the form
}

const RequestPackageModal: React.FC<RequestPackageModalProps> = ({ 
  isOpen, 
  onClose, 
  packageData,
  shareableLink 
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleInstagramShare = () => {
    navigator.clipboard.writeText(shareableLink);
    window.open('https://www.instagram.com/', '_blank');
    alert('Link copied! Paste it in your Instagram story or DM');
  };

  const handleTikTokShare = () => {
    navigator.clipboard.writeText(`Check out this meal package! 🍽️ ${shareableLink}`);
    window.open('https://www.tiktok.com/', '_blank');
    alert('Link copied! Paste it in your TikTok video caption or bio');
  };

  return (
    <div className="fixed inset-0 bg-[#000000b7] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="bg-green-100 rounded-full p-4 mb-4">
            <Check size={32} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Request Created!
          </h2>
          <p className="text-gray-600">
            Share this link with your friends and they can gift it to you!
          </p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <img
              src={packageData.image}
              alt={packageData.package}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900 capitalize">{packageData.package}</h3>
              <p className="text-sm text-gray-500">{packageData.brand}</p>
              {packageData.price && (
                <p className="text-orange-500 font-bold">
                  {formatCurrency(packageData.price, packageData.currency || "NGN")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check size={20} />
                Link Copied!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copy Shareable Link
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500 mb-3">Or share via</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => shareToWhatsApp(shareableLink)}
                className="bg-green-500 hover:bg-green-600 text-white py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </button>
              <button
                onClick={() => shareToFacebook(shareableLink)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="hidden sm:inline">Facebook</span>
              </button>
              <button
                onClick={() => shareToSMS(shareableLink)}
                className="bg-gray-600 hover:bg-gray-700 text-white py-2.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
                </svg>
                <span className="hidden sm:inline">SMS</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleInstagramShare}
                className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90 text-white py-2.5 px-3 rounded-lg text-xs font-medium transition-opacity"
              >
                Instagram
              </button>
              <button
                onClick={handleTikTokShare}
                className="bg-black hover:bg-gray-900 text-white py-2.5 px-3 rounded-lg text-xs font-medium transition-colors"
              >
                TikTok
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> Your friend will receive a link to this package. 
            They can view it and complete the checkout to gift it to you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestPackageModal;