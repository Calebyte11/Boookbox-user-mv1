/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  Path,
  FieldValues,
  Control,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface FormFieldProps<TFormValues extends FieldValues = FieldValues> {
  name: Path<TFormValues>;
  label?: string;
  type?: string;
  register: UseFormRegister<TFormValues>;
  control?: Control<TFormValues>;
  errors: FieldErrors<TFormValues>;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  show?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  rules?: Record<string, unknown>;
  [key: string]: any;
}

const FormField = <TFormValues extends FieldValues>({
  name,
  label,
  type = "text",
  register,
  control,
  errors,
  placeholder,
  show,
  icon,
  className = "mb-4",
  iconPosition = "left",
  inputClassName = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm h-[56px]",
  labelClassName = "block text-sm font-medium text-gray-700",
  errorClassName = "mt-1 text-xs text-red-500",
  rules,
  ...rest
}: FormFieldProps<TFormValues>) => {
  const [showPassword, setShowPassword] = useState(false);
  const error = errors[name];

  const isPasswordType = type === "password";
  const currentInputType = isPasswordType && showPassword ? "text" : type;
  const renderInput = () => {
    if (type === "checkbox") {
      return (
        <div className="flex items-center">
          <input
            id={name}
            type="checkbox"
            className={`${inputClassName} h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary`}
            {...register(name)}
            {...rest}
          />
          {label && (
            <label htmlFor={name} className={`ml-2 ${labelClassName}`}>
              {label}
            </label>
          )}
        </div>
      );
    }
    if (type === "tel" && control) {
      return (
        <div className="relative">
          {label && (
            <label htmlFor={name} className={labelClassName}>
              {label}
            </label>
          )}
          <div
            className={`
            relative flex items-center w-full h-14 bg-white border rounded-md shadow-sm transition-all duration-150 overflow-hidden 
            ${
              error
                ? "border-red-500 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                : "border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
            }
          `}
          >
            <Controller
              name={name}
              control={control}
              rules={rules}
              render={({ field: { onChange, value } }) => (
                <PhoneInput
                  value={value}
                  onChange={onChange}
                  defaultCountry="NG"
                  placeholder={placeholder}
                  className="w-full h-full p-2 [&_.PhoneInputCountrySelect]:border-0 [&_.PhoneInputCountrySelect]:bg-transparent [&_.PhoneInputCountrySelect]:px-3 [&_.PhoneInputCountrySelect]:h-full [&_.PhoneInputCountrySelect]:flex [&_.PhoneInputCountrySelect]:items-center [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountrySelectArrow]:text-gray-500 [&_.PhoneInputCountrySelectArrow]:ml-1 [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-2 [&_.PhoneInputInput]:h-full [&_.PhoneInputInput]:flex-1 [&_.PhoneInputInput]:outline-0 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput::placeholder]:text-gray-400"
                />
              )}
            />
          </div>
        </div>
      );
    }

    const hasIcon = !!icon;
    const paddingLeftClass = hasIcon && iconPosition === "left" ? "pl-10" : "";
    const paddingRightClass =
      (hasIcon && iconPosition === "right") || (isPasswordType && show)
        ? "pr-10"
        : "";
    return (
      <div className="relative">
        {label && type !== "checkbox" && (
          <label htmlFor={name} className={labelClassName}>
            {label}
          </label>
        )}{" "}
        <input
          id={name}
          type={currentInputType}
          placeholder={placeholder}
          className={`${inputClassName} ${paddingLeftClass} ${paddingRightClass} ${
            error
              ? "border-red-500 focus:ring-primary focus:border-red-500"
              : ""
          } ${isPasswordType ? "pr-10" : ""}`}
          {...register(name, rules)}
          {...rest}
        />
        {hasIcon && iconPosition === "right" && !isPasswordType && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none z-10">
            {icon}
          </div>
        )}
        {hasIcon && iconPosition === "left" && (
          <div className="absolute inset-y-0 left-0 pl-0 flex items-center pointer-events-none z-10">
            {icon}
          </div>
        )}
        {isPasswordType && show && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-500 " />
            ) : (
              <Eye className="h-5 w-5 text-gray-500 " />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {renderInput()}
      {error && typeof error.message === "string" && (
        <p className={errorClassName}>{error.message}</p>
      )}
    </div>
  );
};

export default FormField;
