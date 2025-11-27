import React from "react";
import { MessageCircle, Phone, Mail, MapPin, MailIcon } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
// import Button from "./Button";

interface ContactUsButtonProps {
  // Optional customization props
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  showLabel?: boolean;
  variant?: "default" | "icon-only";
  className?: string;
}

const ContactUsButton: React.FC<ContactUsButtonProps> = ({
  position = "bottom-right",
  showLabel = false,
  variant = "default",
  className = "",
}) => {
  // Position classes mapping
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  // const baseButtonClasses =
  //   variant === "icon-only"
  //     ? "w-12 h-12 rounded-full bg-[#FF7A00] text-white shadow-lg hover:bg-[#FF7A00]/90 transition-colors flex items-center justify-center"
  //     : "flex items-center gap-2 px-4 py-3 bg-[#FF7A00] text-white rounded-full shadow-lg hover:bg-[#FF7A00]/90 transition-colors";

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
            <button
            type="button"
            aria-label="Contact BoookBox"
            // className={`${variant === "icon-only" ? "aspect-square" : ""}`}
            >
            <MailIcon className="w-10 h-10 bg-primary rounded-full p-2 text-white shadow-lg hover:bg-[#FF7A00]/90 transition-colors" />
            {variant === "default" && showLabel && (
              <span className="font-medium">Contact BoookBox</span>
            )}
            </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[280px] bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
            sideOffset={12}
            align="start"
            side="top"
            avoidCollisions={true}
            collisionPadding={16}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Contact BoookBox
              </h3>

              {/* Phone Contact */}
              <DropdownMenu.Item asChild>
                <a
                  href="tel:+2348142454106"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer outline-none focus:bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-sm text-gray-600">+234 8142454106</p>
                  </div>
                </a>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

              {/* Email */}
              <DropdownMenu.Item asChild>
                <a
                  href="mailto:officialBoookbox@gmail.com"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer outline-none focus:bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">
                      officialBoookbox@gmail.com
                    </p>
                  </div>
                </a>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

              {/* WhatsApp/Live Chat */}
              <DropdownMenu.Item asChild>
                <a
                  href="https://wa.me/2347065813394"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer outline-none focus:bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[#FF7A00]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp</p>
                    <p className="text-sm text-gray-600">+234 7065813394</p>
                  </div>
                </a>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

              {/* Location */}
              <DropdownMenu.Item className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer outline-none focus:bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#FF7A00]" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">Nigeria</p>
                </div>
              </DropdownMenu.Item>
            </div>
            <DropdownMenu.Arrow className="fill-white" />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export default ContactUsButton;
