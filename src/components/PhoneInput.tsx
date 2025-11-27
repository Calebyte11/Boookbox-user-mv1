/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  Path,
  FieldValues,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// Common country codes - you can expand this list
const COUNTRY_CODES = [
    { code: "+213", country: "Algeria", flag: "🇩🇿" },
    { code: "+229", country: "Benin", flag: "🇧🇯" },
    { code: "+267", country: "Botswana", flag: "🇧🇼" },
    { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
    { code: "+237", country: "Cameroon", flag: "🇨🇲" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
    { code: "+20", country: "Egypt", flag: "🇪🇬" },
    { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+233", country: "Ghana", flag: "🇬🇭" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+254", country: "Kenya", flag: "🇰🇪" },
    { code: "+223", country: "Mali", flag: "🇲🇱" },
    { code: "+212", country: "Morocco", flag: "🇲🇦" },
    { code: "+227", country: "Niger", flag: "🇳🇪" },
    { code: "+234", country: "Nigeria", flag: "🇳🇬" },
    { code: "+221", country: "Senegal", flag: "🇸🇳" },
    { code: "+27", country: "South Africa", flag: "🇿🇦" },
    { code: "+255", country: "Tanzania", flag: "🇹🇿" },
    { code: "+256", country: "Uganda", flag: "🇺🇬" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
    { code: "+1", country: "United States", flag: "🇺🇸" },
    { code: "+260", country: "Zambia", flag: "🇿🇲" },
    { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
];

type CountryCode = (typeof COUNTRY_CODES)[number];

interface PhoneInputProps<TFormValues extends FieldValues = FieldValues> {
  name: Path<TFormValues>;
  register: UseFormRegister<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  watch: UseFormWatch<TFormValues>;
  errors: FieldErrors<TFormValues>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  errorClassName?: string;
  defaultCountryCode?: string;
  rules?: Record<string, unknown>;
  [key: string]: any;
}

const PhoneInput = <TFormValues extends FieldValues>({
  name,
  register,
  setValue,
  watch,
  errors,
  placeholder = "Enter phone number",
  className = "mb-4",
  inputClassName = "p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary w-full",
  errorClassName = "mt-1 text-xs text-red-500",
  defaultCountryCode = "+234",
  rules,
  ...rest
}: PhoneInputProps<TFormValues>) => {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRY_CODES.find((c) => c.code === defaultCountryCode) || COUNTRY_CODES[0]
  );
  const error = errors[name];
  const phoneValue = watch(name) || "";

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country);
    // Update the full phone number with new country code if there's an existing local number
    const currentLocalNumber = phoneValue.startsWith(selectedCountry.code)
      ? phoneValue.slice(selectedCountry.code.length)
      : phoneValue.replace(/^\+\d+/, "");

    if (currentLocalNumber) {
      setValue(name, (country.code + currentLocalNumber) as any, {
        shouldValidate: true,
      });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any non-digit characters except spaces and dashes for formatting
    const cleanValue = value.replace(/[^\d\s-]/g, "");

    // Set the complete phone number with country code
    const fullPhoneNumber = selectedCountry.code + cleanValue;
    setValue(name, fullPhoneNumber as any, { shouldValidate: true });
  };

  const displayValue = phoneValue.startsWith(selectedCountry.code)
    ? phoneValue.slice(selectedCountry.code.length)
    : phoneValue;

  return (
    <div className={className}>
      <div className="flex">
        {/* Country Code Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-4 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            >
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium">
                {selectedCountry.code}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto min-w-[250px]"
              sideOffset={5}
              align="start"
            >
              {COUNTRY_CODES.map((country) => (
                <DropdownMenu.Item
                  key={country.code}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer focus:bg-gray-100 focus:outline-none"
                  onSelect={() => handleCountryChange(country)}
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{country.country}</div>
                    <div className="text-xs text-gray-500">{country.code}</div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Phone Number Input */}
        <input
          type="tel"
          placeholder={placeholder}
          value={displayValue}
          onChange={handlePhoneChange}
          className={`${inputClassName} rounded-l-none border-l-0 flex-1 ${
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
              : ""
          }`}
          {...rest}
        />
      </div>

      {/* Hidden input for form registration */}
      <input type="hidden" {...register(name, rules)} value={phoneValue} />

      {/* Error message */}
      {error && typeof error.message === "string" && (
        <p className={errorClassName}>{error.message}</p>
      )}
    </div>
  );
};

export default PhoneInput;
