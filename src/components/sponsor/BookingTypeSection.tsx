import React from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { ChevronDown, Check, Circle } from "lucide-react";
import * as RadixSelect from "@radix-ui/react-select";
// import { Tooltip, IconButton } from "@radix-ui/themes";
import Reslider from "@/components/ReSlide";
import type { OrderFormValues } from "@/features/sponsor/types";

interface BookingTypeSectionProps {
  control: Control<OrderFormValues>;
  errors?: FieldErrors<OrderFormValues>;
}

const BookingTypeSection: React.FC<BookingTypeSectionProps> = ({
  control,
}) => {
  const bookingType = ["yourself", "others", "public", "date"];

  return (
    <div className="m-4">
      <p className="text-xl font-medium tracking pb-2">Are you booking for</p>
      <Controller
        name="bookingType"
        control={control}
        render={({ field }) => (
          <>
            {/* Mobile: native select dropdown */}
            <div className="lg:hidden">
              <label htmlFor="booking-type-select" className="sr-only">
                Booking type
              </label>
              <RadixSelect.Root
                value={field.value}
                onValueChange={(val) => field.onChange(val)}
              >
                <RadixSelect.Trigger
                  id="booking-type-select"
                  className="inline-flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  aria-label="Select booking type"
                >
                  <RadixSelect.Value />
                  <RadixSelect.Icon>
                    <ChevronDown size={16} />
                  </RadixSelect.Icon>
                </RadixSelect.Trigger>

                <RadixSelect.Portal>
                  <RadixSelect.Content
                    sideOffset={8}
                    align="end"
                    className="bg-white border border-gray-200 rounded-md shadow-lg p-1 z-50 min-w-[160px]"
                  >
                    <RadixSelect.Viewport>
                      {bookingType.map((bt) => (
                        <RadixSelect.Item
                          key={`booking-type-${bt}`}
                          value={bt}
                          className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-primary/10 cursor-pointer"
                        >
                          <RadixSelect.ItemText>
                            <div className="flex items-center gap-2">
                              <span>{bt.charAt(0).toUpperCase() + bt.slice(1)}</span>
                              {/* {bt === "date" && (
                                <Tooltip content="Date Options: Dine-in with me, Hangout with me, Roundtable Dine-in, Share a plate with me">
                                  <IconButton size="1" variant="ghost" radius="full">
                                    <Info size={14} />
                                  </IconButton>
                                </Tooltip>
                              )} */}
                            </div>
                          </RadixSelect.ItemText>
                          <RadixSelect.ItemIndicator className="ml-auto">
                            <Check size={14} />
                          </RadixSelect.ItemIndicator>
                        </RadixSelect.Item>
                      ))}
                    </RadixSelect.Viewport>
                  </RadixSelect.Content>
                </RadixSelect.Portal>
              </RadixSelect.Root>
            </div>

            {/* Desktop / tablet: keep existing Reslider */}
            <div className="hidden lg:block">
              <Reslider
                data={bookingType}
                renderSlide={(bookingItem, index) => (
                  <div
                    key={`booking-${index}-${bookingItem}`}
                    className={`flex gap-1 border-[#CAC4D0] border cursor-pointer rounded-lg `}
                    onClick={() => field.onChange(bookingItem)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        field.onChange(bookingItem);
                    }}
                    aria-pressed={field.value === bookingItem}
                  >
                    <div
                      className={`flex justify-between px-6 gap-2 p-4 bg-white rounded-lg w-[219px] h-[64px] items-center ${
                        field.value === bookingItem
                          ? "rounded font-semibold "
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <p className="capitalize">{bookingItem}</p>
                        {/* {bookingItem === "date" && (
                          <Tooltip content="Date Options: Dine-in with me, Hangout with me, Roundtable Dine-in, Share a plate with me"
                          
                          >
                            <IconButton size="1" variant="ghost" radius="full">
                              <Info size={16} />
                            </IconButton>
                          </Tooltip>
                        )} */}
                      </div>
                      <Circle
                        fill={`${
                          field.value === bookingItem ? "#ff7a00" : "white"
                        }`}
                        className={`rounded-full  ${
                          field.value === bookingItem
                            ? "ring-primary ring text-primary p-1 border border-primary rounded-full"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                )}
              />
            </div>
          </>
        )}
      />
    </div>
  );
};

export default BookingTypeSection;