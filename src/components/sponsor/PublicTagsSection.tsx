import React from "react";
import { type FieldErrors, type UseFormRegister, type UseFormSetValue } from "react-hook-form";
import { ChevronDown, Check } from "lucide-react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import FormField from "@/components/FormField";
import type { OrderFormValues } from "@/features/sponsor/types";

interface PublicTagsSectionProps {
  errors?: FieldErrors<OrderFormValues>;
  register: UseFormRegister<OrderFormValues>;
  numberOfRecipientsValueWatched: string;
  setValue: UseFormSetValue<OrderFormValues>;
}

const PublicTagsSection: React.FC<PublicTagsSectionProps> = ({
  errors,
  register,
  numberOfRecipientsValueWatched,
  setValue,
}) => {
  return (
    <div className="m-4">
      <div className="border-t border-gray-300 my-4" />
      <p className="text-xl font-medium mb-4">Public Booking Details</p>

      {/* Number of Recipients for Public Booking */}
      <div className="mb-4">
        <label className="block text-lg font-medium mb-2">
          Number of Recipients
        </label>
        <div className="relative">
          <FormField<OrderFormValues>
            name="numberOfRecipients"
            type="number"
            register={register}
            errors={errors || {}}
            placeholder="Enter number of recipients"
            inputClassName="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[44px]"
          />
          <RadixDropdownMenu.Root>
            <RadixDropdownMenu.Trigger asChild>
              <button
                type="button"
                className="absolute right-5 top-0 transform translate-y-1/2 text-gray-500 hover:text-gray-700 flex items-center focus:outline-none"
                aria-label="Select number of recipients"
              >
                <span className="mr-1 text-sm text-medium">
                  {numberOfRecipientsValueWatched || "1"}
                </span>
                <ChevronDown size={16} />
              </button>
            </RadixDropdownMenu.Trigger>
            <RadixDropdownMenu.Portal>
              <RadixDropdownMenu.Content
                className="bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[80px] max-h-[200px] overflow-y-auto p-1"
                sideOffset={5}
                align="end"
              >
                {[...Array(20).keys()]
                  .map((i) => i + 1)
                  .map((num) => (
                    <RadixDropdownMenu.Item
                      key={`public-recipient-${num}`}
                      className="relative flex items-center justify-center px-4 py-2 rounded-md text-sm select-none data-[highlighted]:bg-primary data-[highlighted]:text-white cursor-pointer"
                      onSelect={() => {
                        setValue("numberOfRecipients", String(num));
                      }}
                    >
                      {num}
                      {numberOfRecipientsValueWatched === String(num) && (
                        <Check className="absolute left-2 w-4 h-4 text-primary data-[highlighted]:text-white" />
                      )}
                    </RadixDropdownMenu.Item>
                  ))}
              </RadixDropdownMenu.Content>
            </RadixDropdownMenu.Portal>
          </RadixDropdownMenu.Root>
        </div>
      </div>

      {/* Tags Input */}
      <div>
        <label className="block text-lg font-medium mb-2">Add Tags</label>
        <FormField<OrderFormValues>
          name="publicTags"
          register={register}
          errors={errors || {}}
          placeholder="e.g., christmas, community, charity (separate with commas)"
          inputClassName="w-full px-3 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <p className="text-sm text-gray-500 mt-2">
          Add tags to help people find your public meal offering. Use
          hashtags like christmas, community, charity, etc.
        </p>
      </div>
    </div>
  );
};

export default PublicTagsSection;