import React from "react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { ChevronDown, 
    // Check, 
    Circle } from "lucide-react";
import * as RadixSelect from "@radix-ui/react-select";
import Reslider from "@/components/ReSlide";
import type { OrderFormValues } from "@/features/sponsor/types";

interface RedemptionModeSectionProps {
  control: Control<OrderFormValues>;
  errors?: FieldErrors<OrderFormValues>;
}

const RedemptionModeSection: React.FC<RedemptionModeSectionProps> = ({
  control,
  errors,
}) => {
  const redemption = [
    { name: "pick-up", description: "get at restaurant" },
    { name: "delivery", description: "get packed delivered" },
    { name: "dine-in", description: "enjoy your meal at the restaurant" },
    { name: "dine-with-me", description: "dine together at the restaurant" },
  ];

  return (
    <div className="mx-4">
      <p className="text-xl mb-4 font-medium">
        Mode of meal ticket redemption
      </p>
      <Controller
        name="redemptionMode"
        control={control}
        render={({ field }) => (
          <>
            {/* Mobile: native select dropdown for redemption mode */}
            <div className="lg:hidden">
              <label htmlFor="redemption-mode-select" className="sr-only">
                Redemption mode
              </label>
              <RadixSelect.Root
                value={field.value}
                onValueChange={(val) => field.onChange(val)}
              >
                <RadixSelect.Trigger
                  id="redemption-mode-select"
                  className="inline-flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary capitalize"
                  aria-label="Select redemption mode"
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
                    className="bg-white border border-gray-200 rounded-md shadow-lg p-1 z-50 min-w-[200px]"
                  >
                    <RadixSelect.Viewport>
                      {redemption.map((r) => (
                        <RadixSelect.Item
                          key={`redemption-${r.name}`}
                          value={r.name}
                          className="flex flex-col px-3 py-2 text-sm rounded-md hover:bg-primary/10 cursor-pointer"
                        >
                          <RadixSelect.ItemText>
                            <div className="flex items-start justify-between w-full">
                              <div className="flex flex-col justify-items-start items-start">
                                <span className="capitalize font-medium">
                                  {r.name} 
                                </span>
                                <span className="text-gray-500 text-xs">
                                  {r.description}
                                </span>
                              </div>
                              {/* <RadixSelect.ItemIndicator className="ml-auto">
                                <Check size={14} />
                              </RadixSelect.ItemIndicator> */}
                            </div>
                          </RadixSelect.ItemText>
                        </RadixSelect.Item>
                      ))}
                    </RadixSelect.Viewport>
                  </RadixSelect.Content>
                </RadixSelect.Portal>
              </RadixSelect.Root>
            </div>

            {/* Desktop / tablet: keep existing Reslider */}
            <div className="hidden">
              <Reslider
                data={redemption}
                renderSlide={(redemptionItem, index) => (
                  <div
                    key={`redemption-${index}-${redemptionItem.name}`}
                    className={`flex gap-1 border-[#CAC4D0] border cursor-pointer rounded-lg py-4 `}
                    onClick={() => field.onChange(redemptionItem.name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        field.onChange(redemptionItem.name);
                    }}
                    aria-pressed={field.value === redemptionItem.name}
                  >
                    <div
                      className={`flex justify-between px-6 gap-2 p-2 bg-white rounded-lg w-[219px] h-[64px]  items-center ${
                        field.value === redemptionItem.name ? "" : ""
                      }`}
                    >
                      <div>
                        <p className="capitalize text-medium">
                          {redemptionItem.name}
                        </p>
                        <p className=" text-gray-500 text-sm">
                          {redemptionItem.description}
                        </p>
                        {redemptionItem.name === "Delivery" && (
                          <p className="text-bold text-sm">
                            Begins from ₦500
                          </p>
                        )}
                      </div>
                      <Circle
                        fill={`${
                          field.value === redemptionItem.name
                            ? "#ff7a00"
                            : "white"
                        }`}
                        className={`rounded-full  ${
                          field.value === redemptionItem.name
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
      {errors?.redemptionMode && (
        <p className="text-red-500 text-xs m-4">
          {errors.redemptionMode.message}
        </p>
      )}
    </div>
  );
};

export default RedemptionModeSection;