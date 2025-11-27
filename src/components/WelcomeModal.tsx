import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Gift,
  Users,
  CreditCard,
  Store,
  Package,
  TrendingUp,
  Send,
  HandPlatter,
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to BoookBox",
      subtitle: "The World's renowned platform for meal gifting and redemption",
      type: "user",
      content: {
        heading: "As a User on BoookBox you can:",
        features: [
          {
            icon: <Store className="w-5 h-5" />,
            text: "Order meals from kitchens around the world for self",
          },
          {
            icon: <Gift className="w-5 h-5" />,
            text: "Gift meal tickets to family, friends and loved ones",
          },
          {
            icon: <Users className="w-5 h-5" />,
            text: "Claim gifted meal tickets",
          },
          {
            icon: <CreditCard className="w-5 h-5" />,
            text: "Make payments for meal bookings",
          },
          {
            icon: <Send className="w-5 h-5" />,
            text: "Send Meal tickets",
          },
          {
            icon: <HandPlatter className="w-5 h-5" />,
            text: "Receive Meal tickets",
          },
          {
            icon: <Users className="w-5 h-5" />,
            text: "Carry out public meal distribution through meal ticketing",
          },
          {
            icon: <Gift className="w-5 h-5" />,
            text: "Turn meal gifting into social engagements and more",
          },
        ],
      },
    },
    {
      title: "Business Solutions",
      subtitle: "Grow your food business with BoookBox",
      type: "business",
      content: {
        heading: "As a Business on BoookBox you can:",
        features: [
          {
            icon: <Package className="w-5 h-5" />,
            text: "Create packages for sale",
          },
          {
            icon: <Store className="w-5 h-5" />,
            text: "Sell meals as packages",
          },
          {
            icon: <Users className="w-5 h-5" />,
            text: "Receive meal booking orders from users",
          },
          {
            icon: <CreditCard className="w-5 h-5" />,
            text: "Accept meal booking payments",
          },
          {
            icon: <Gift className="w-5 h-5" />,
            text: "Redeem meal tickets of users",
          },
          {
            icon: <TrendingUp className="w-5 h-5" />,
            text: "Monitor business growth and more...",
          },
        ],
      },
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border border-gray-200 bg-white p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div
            className={`px-6 py-4 ${
              currentStepData.type === "user"
                ? "bg-gradient-to-r from-primary to-primary/90"
                : "bg-gradient-to-r from-secondary to-secondary/90"
            } text-white relative`}
          >
            <Dialog.Close asChild>
              <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>

            <div className="pr-8">
              <Dialog.Title className="text-xl font-semibold leading-none tracking-tight mb-2">
                {currentStepData.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-white/90">
                {currentStepData.subtitle}
              </Dialog.Description>
            </div>

            {/* Step indicator */}
            <div className="flex gap-2 mt-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-white"
                      : index < currentStep
                      ? "bg-white/70"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              {currentStepData.content.heading}
            </h3>

            <div className="space-y-3">
              {currentStepData.content.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded-md ${
                      currentStepData.type === "user"
                        ? "bg-orange-100 text-primary"
                        : "bg-blue-100 text-secondary"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1">
                    {feature.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStep === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentStepData.type === "user"
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-secondary hover:bg-secondary/90 text-white"
              }`}
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"}
              {currentStep < steps.length - 1 && (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default WelcomeModal;
